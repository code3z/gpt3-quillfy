import Head from "next/head"
import { DOMAttributes, useEffect, useRef, useState } from "react"
import React from "react"
import clsx from "clsx"
import { useLocalStorage } from "../lib/useLocalStorage"
import TextEditor from "../components/TextEditor"

function getRawText(htmlText: string) {
  const el = document.createElement("div")
  el.innerHTML = htmlText
  return el.innerText
}

const Home = () => {
  const [textUsed, setTextUsed] = useState("")
  const [prompt, setPrompt] = useLocalStorage("APP_PROMPT", "")
  const [text, setText] = useLocalStorage("APP_TEXT", "")
  const [apiOutput, setApiOutput] = useState({ edits: [] })
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedEdit, setSelectedEdit] = useState(null)
  const textBody = useRef<HTMLDivElement>()

  const handleSubmit: DOMAttributes<HTMLButtonElement>["onClick"] = async (
    e
  ) => {
    setIsGenerating(true)
    setTextUsed(text)
    setSelectedEdit(null)
    const rawText = getRawText(text)
    console.log("Calling OpenAI...")

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: rawText, prompt }),
    })

    const data = await response.json()
    const { output } = data
    console.log("OpenAI replied...", output.text)

    setApiOutput(data)
    setIsGenerating(false)
  }

  useEffect(() => {
    if (textBody.current)
      for (const edit of apiOutput.edits) {
        try {
          console.log(textBody.current, textUsed, edit.original)

          const range = new Range()
          const textIndex = textBody.current.lastChild.textContent.indexOf(
            edit.original
          )
          if (textIndex !== -1) {
            range.setStart(textBody.current.lastChild, textIndex)
            range.setEnd(
              textBody.current.lastChild,
              textIndex + edit.original.length
            )
            const button = document.createElement("mark")
            button.onclick = () => alert("haha")
            button.classList.add("bg-blue-100", "rounded-sm")
            range.surroundContents(button)
          }
        } catch (e) {
          console.log(e)
        }
      }
  }, [apiOutput, textBody])

  return (
    <div className="root">
      <Head>
        <title>GPT-3 Writer | buildspace</title>
      </Head>
      <div className="container">
        <div className="mr-auto mb-4">
          <h1 className="text-4xl font-bold mb-1 manrope">Lizoy</h1>
          <div className="text-lg mt-0.5 text-gray-800 manrope">
            <h2>Get writing feedback from an expert AI</h2>
          </div>
        </div>
        <label
          htmlFor="text-input"
          className="font-semibold text-gray-700 mb-1 block manrope"
        >
          What do you want to improve?
        </label>
        <input
          id="text-input"
          className="bg-gray-100 rounded-xl p-4 w-full"
          value={prompt}
          placeholder="Paste here..."
          onChange={(e) => setPrompt(e.target.value)}
        />
        <label
          htmlFor="user-input"
          className="font-semibold text-gray-700 mb-1 block mt-4 manrope"
        >
          Enter text
        </label>
        <div className="grid grid-cols-[2fr_1fr] gap-4">
          <TextEditor text={text} setText={setText} edits={apiOutput.edits} />
          <div>
            {isGenerating
              ? "getting high-quality feedback..."
              : apiOutput.edits.map((edit, i) => (
                  <button
                    key={i}
                    className={clsx(
                      `mb-8 p-4 shadow-md border rounded-xl text-left`,
                      selectedEdit === i && "bg-gray-50 border-2"
                    )}
                    onClick={() => setSelectedEdit(i)}
                  >
                    <p className="text-sm line-through text-gray-600">
                      {edit.original}
                    </p>
                    <p>{edit.edit}</p>
                    <p className="text-sm text-gray-800 font-semibold mt-1">
                      {selectedEdit === i && edit.suggestion}
                    </p>
                  </button>
                ))}
          </div>
          <div className="prompt-buttons mt-3">
            <button
              className="generate-button"
              onClick={handleSubmit}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <span className="loader"></span>
              ) : (
                <p>Get Free Suggestions</p>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[2fr_1fr] gap-6 mt-8">
          <div className="leading-7 whitespace-pre-wrap" ref={textBody}>
            {textUsed}
          </div>
          <div>
            {isGenerating
              ? "getting high-quality feedback..."
              : apiOutput.edits.map((edit, i) => (
                  <button
                    key={i}
                    className={clsx(
                      `mb-8 p-4 shadow-md border rounded-xl text-left`,
                      selectedEdit === i && "bg-gray-50 border-2"
                    )}
                    onClick={() => setSelectedEdit(i)}
                  >
                    <p className="text-sm line-through text-gray-600">
                      {edit.original}
                    </p>
                    <p>{edit.edit}</p>
                    <p className="text-sm text-gray-800 font-semibold mt-1">
                      {selectedEdit === i && edit.suggestion}
                    </p>
                  </button>
                ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
