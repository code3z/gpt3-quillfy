import Head from "next/head"
import { DOMAttributes, useEffect, useRef, useState } from "react"
import React from "react"
import clsx from "clsx"
import { useLocalStorage } from "../lib/useLocalStorage"
import { Button, Input, useToasts } from "@geist-ui/core"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

import dynamic from "next/dynamic"

const TextEditor = dynamic(() => import("../components/TextEditor"), {
  ssr: false,
  loading: () => <>Loading Editor...</>,
})

function getRawText(htmlText: string) {
  const el = document.createElement("div")
  el.innerHTML = htmlText
  return el.innerText
}

const Home = () => {
  const [textUsed, setTextUsed] = useState("")
  const [prompt, setPrompt] = useLocalStorage("APP_PROMPT", "")
  const [text, setText] = useLocalStorage("APP_TEXT", "")
  const [apiOutput, setApiOutput] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedEdit, setSelectedEdit] = useState(null)
  const textBody = useRef<HTMLDivElement>()
  const { setToast } = useToasts()

  const showError = () => {
    setToast({
      text: "There was an error editing text, try again",
      type: "warning",
      actions: [
        {
          name: "cancel",
          passive: true,
          handler: (event, cancel) => cancel(),
        },
      ],
    })
    setIsGenerating(false)
  }
  const handleSubmit: DOMAttributes<HTMLButtonElement>["onClick"] = async (
    e
  ) => {
    try {
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
      if (response.status !== 200) {
        showError()
        return
      }
      const data = await response.json()
      const { output } = data
      console.log("OpenAI replied...", output.text)

      setApiOutput(data)
      setIsGenerating(false)
    } catch (e) {
      console.log(e)
      showError()
    }
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

        <div
          className={clsx(
            `grid gap-4`,
            (apiOutput && apiOutput.edits) || isGenerating
              ? "md:grid-cols-[2fr_1fr]"
              : ""
          )}
        >
          <TextEditor
            text={text}
            setText={setText}
            edits={apiOutput ? apiOutput.edits : []}
            setSelectedEdit={setSelectedEdit}
          />
          <div>
            {isGenerating ? (
              <div className="text-gray-800">
                generating edits, this can take a while...{" "}
                <Skeleton height={150} count={3} />
              </div>
            ) : (
              apiOutput &&
              apiOutput.edits.map((edit, i) => (
                <button
                  key={i}
                  className={clsx(
                    `mb-8 p-4 shadow-md border rounded-xl text-left`,
                    selectedEdit === i && "bg-gray-50 border-2 border-blue-300"
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
              ))
            )}
          </div>
          <div>
            <div>
              <Input
                value={prompt}
                placeholder="make it more professional"
                scale={4 / 3}
                onChange={(e) => setPrompt(e.target.value)}
              >
                What do you want to improve?
              </Input>
            </div>
            <div className="flex">
              <Button
                auto
                onClick={handleSubmit}
                type="success"
                className="!mt-5 !ml-auto"
                loading={isGenerating}
                disabled={isGenerating}
              >
                Get Feedback
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
