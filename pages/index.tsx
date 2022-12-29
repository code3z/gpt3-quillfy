import Head from "next/head"
import { useState } from "react"
import React from "react"

const Home = () => {
  const [userInput, setUserInput] = useState("")

  return (
    <div className="root">
      <Head>
        <title>GPT-3 Writer | buildspace</title>
      </Head>
      <div className="container">
        <div className="mr-auto mb-4">
          <h1 className="text-4xl font-bold mb-1">Lizoy</h1>
          <div className="text-lg mt-0.5 text-gray-800">
            <h2>Get writing feedback from an expert AI</h2>
          </div>
        </div>
        <div className="w-full">
          <label
            htmlFor="user-input"
            className="font-semibold text-gray-700 mb-0.5 block"
          >
            Enter text
          </label>
          <textarea
            id="user-input"
            className="bg-gray-100 rounded-xl p-4 w-full min-h-[15rem]"
            value={userInput}
            placeholder="Paste here..."
            onChange={(e) => setUserInput(e.target.value)}
          />
          <div className="prompt-buttons mt-3">
            <button
              className="generate-button"
              onClick={() => alert("generate")}
            >
              Get Expert Suggestions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
