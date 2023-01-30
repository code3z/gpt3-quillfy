import Head from "next/head"
import { DOMAttributes, useEffect, useRef, useState } from "react"
import React from "react"
import clsx from "clsx"
import { useLocalStorage } from "../lib/useLocalStorage"
import { Button, Input, Tooltip, useToasts } from "@geist-ui/core"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import TextEditor from "../components/TextEditor"
import Image from "next/image"
import feather from "public/feather.svg"

const tips = [
  `Make a clear prompt that someone could understand if they read "Rewrite this text to <your prompt>"`,
  `If you need to make your writing longer or shorter, more or less formal, quillify can help with that!`,
  `You may need to run this multiple times to get good results.`,
  `Quillify can suggest potential figurative language and metaphors to use.`,
  `Quillify can't edit long pieces of text yet, but we're working on it!`,
  `Don't hesitate to use the chat bubble to give feedback and request new features!`,
]

const suggestedPrompts = [
  "make it more professional",
  "use figurative language and metaphor",
  "make the language flow better",
  "make it more concise",
  "make it longer",
]

function getRawText(htmlText: string) {
  const el = document.createElement("div")
  el.innerHTML = htmlText
  return el.innerText
}

const Home = () => {
  const [textUsed, setTextUsed] = useState("")
  const [prompt, setPrompt] = useLocalStorage("APP_PROMPT", "")
  const [text, setText] = useLocalStorage("APP_TEXT", "")
  const [edits, setEdits] = useState(null)
  // these are the edits that were generated, not the ones currently displayed:
  const [generatedEdits, setGeneratedEdits] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedEdit, setSelectedEdit] = useState(null)
  const textBody = useRef<HTMLDivElement>()
  const { setToast } = useToasts({
    placement: "topRight",
  })
  const [acceptedEdits, setAcceptedEdits] = useState([])
  const [tip, setTip] = useState(null)

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
      if (!prompt) {
        setToast({
          text: "Please enter a prompt",
          type: "warning",
          actions: [
            {
              name: "cancel",
              passive: true,
              handler: (event, cancel) => cancel(),
            },
          ],
        })
        return
      }
      setTip(tips[Math.floor(Math.random() * tips.length)])
      setIsGenerating(true)
      setTextUsed(text)
      setSelectedEdit(null)
      setEdits(null)
      setAcceptedEdits([])
      setGeneratedEdits(null)

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

      setEdits(data.edits)
      setGeneratedEdits(data.edits)
      setIsGenerating(false)
    } catch (e) {
      console.log(e)
      showError()
    }
  }

  useEffect(() => {
    if (textBody.current)
      for (const edit of edits) {
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
  }, [edits, textBody])

  return (
    <div className="root">
      <Head>
        <title>quillfy</title>
      </Head>
      <div className="container">
        <div className="mr-auto mb-4">
          <h1 className="text-4xl font-black tracking-tight mb-1 manrope">
            <Image
              src={feather}
              alt="logo"
              className="w-[1.3em] h-[1.3em] inline mr-1 mb-1"
            />{" "}
            quillfy
          </h1>
          <div className="text-lg mt-0.5 text-gray-800 manrope">
            <h2>Get writing feedback from an expert AI</h2>
          </div>
        </div>

        <div
          className={clsx(
            `grid gap-5`,
            edits || isGenerating ? "md:grid-cols-[2fr_1fr]" : ""
          )}
        >
          <div>
            <TextEditor
              text={text}
              setText={setText}
              edits={edits}
              setSelectedEdit={setSelectedEdit}
              acceptedEdits={acceptedEdits}
              selectedEdit={selectedEdit}
            />
            <div className="mt-4">
              <Input
                value={prompt}
                placeholder="make it more professional"
                label="Change this text to"
                scale={4 / 3}
                width="100%"
                onChange={(e) => setPrompt(e.target.value)}
              >
                What do you want to improve?
              </Input>
              <div className="mt-3 space-x-1">
                Try:{" "}
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={prompt}
                    className="text-blue-700 hover:underline"
                    onClick={() => setPrompt(prompt)}
                  >
                    {prompt}
                    {i !== suggestedPrompts.length - 1 ? ", " : " "}
                  </button>
                ))}
              </div>
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
          <div>
            {isGenerating ? (
              <div className="text-gray-800 text-center">
                <Skeleton height={150} count={2} />
                <p className="mt-3 text-gray-700">
                  Generating edits, this can take a while...
                </p>
                <p className="mt-3 font-medium">Tip: {tip}</p>
              </div>
            ) : (
              edits &&
              edits.map((edit, i) => (
                <div
                  key={edit.original}
                  className={clsx(
                    `mb-8 p-4 shadow-md border rounded-xl text-left`,
                    selectedEdit === i && "bg-gray-50 border-2 border-blue-300"
                  )}
                  onClick={() => setSelectedEdit(i)}
                >
                  {edit.original.trim() === "N/A" ? (
                    <p className="text-sm text-gray-600">Consider Adding:</p>
                  ) : (
                    <p className="text-sm line-through text-gray-600">
                      {edit.original}
                    </p>
                  )}
                  <p>{edit.edit}</p>
                  <p className="text-sm text-gray-800 font-semibold mt-1">
                    {selectedEdit === i && edit.suggestion}
                  </p>
                  {selectedEdit === i && edit.original.trim() !== "N/A" && (
                    <div className="flex gap-3 mt-3 w-full">
                      <Tooltip
                        text={"Accepting will remove formatting"}
                        type="dark"
                        placement="bottomStart"
                      >
                        <Button
                          className="inline"
                          type="success"
                          onClick={() => {
                            setAcceptedEdits((prev) => [...prev, edit])
                            setEdits((prev) => {
                              const edits = [...prev]
                              return edits.filter(
                                (item) => item.original !== edit.original
                              )
                            })
                          }}
                        >
                          Accept
                        </Button>
                      </Tooltip>
                      <Button
                        onClick={() => {
                          setSelectedEdit(null)
                          setEdits((prev) => {
                            const edits = [...prev]
                            return edits.filter(
                              (item) => item.original !== edit.original
                            )
                          })
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
            {generatedEdits && generatedEdits.length === 0 && (
              <>
                We didn't find anything to improve, but feel free to generate
                feedback again!&nbsp;
                <button
                  onClick={handleSubmit}
                  className="text-blue-600 underline"
                >
                  Generate Feedback
                </button>
              </>
            )}
            {edits && edits.length === 0 && generatedEdits.length > 0 && (
              <>
                No edits left, feel free to generate some more.&nbsp;
                <button
                  onClick={handleSubmit}
                  className="text-blue-600 underline"
                >
                  Generate Feedback
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
