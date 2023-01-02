import Head from "next/head"
import { DOMAttributes, useState } from "react"
import React from "react"

const Home = () => {
  const [text, setText] = useState("")
  const [textUsed, setTextUsed] = useState("")
  const [prompt, setPrompt] = useState("")
  const [apiOutput, setApiOutput] = useState({ edits: [] })
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedEdit, setSelectedEdit] = useState(0)

  const handleSubmit: DOMAttributes<HTMLFormElement>["onSubmit"] = async (
    e
  ) => {
    e.preventDefault()
    setIsGenerating(true)
    setTextUsed(text)
    setSelectedEdit(0)

    console.log("Calling OpenAI...")
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, prompt }),
    })

    const data = await response.json()
    const { output } = data
    console.log("OpenAI replied...", output.text)

    setApiOutput(data)
    setIsGenerating(false)
  }

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
        <form className="w-full" onSubmit={handleSubmit}>
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
          <textarea
            id="user-input"
            className="bg-gray-100 rounded-xl p-4 w-full min-h-[15rem]"
            value={text}
            placeholder="Paste here..."
            onChange={(e) => setText(e.target.value)}
          />
          <div className="prompt-buttons mt-3">
            <button className="generate-button">
              {isGenerating ? (
                <span className="loader"></span>
              ) : (
                <p>Get Free Suggestions</p>
              )}
            </button>
          </div>
        </form>
        <div className="grid grid-cols-[2fr_1fr] gap-6 mt-8">
          <div className="leading-7 whitespace-pre-wrap">{textUsed}</div>
          <div>
            {isGenerating
              ? "getting high-quality feedback..."
              : apiOutput.edits.map((edit, i) => (
                  <div key={i} className="mb-8 p-4 shadow-md border rounded-lg">
                    <p className="text-sm line-through text-gray-600">
                      {edit.original}
                    </p>
                    <p>{edit.edit}</p>
                    <p className="text-sm text-gray-800 font-semibold mt-1">
                      {edit.suggestion}
                    </p>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
