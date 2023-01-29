import React, { useEffect, useRef, useState } from "react"
import { Editor } from "@tinymce/tinymce-react"
import InstantSearch from "../lib/Highlighter"

// https://chrisboakes.com/how-a-javascript-debounce-function-works/
function debounce(callback, wait) {
  let timeout
  return (...args) => {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => callback.apply(context, args), wait)
  }
}

export default function TextEditor({
  text,
  setText,
  edits,
  setSelectedEdit,
  selectedEdit,
  acceptedEdits,
}: {
  text: string
  setText: (text: string) => void
  edits: { original: string; suggestion: string; edit: string }[]
  setSelectedEdit: (edit: number) => void
  selectedEdit: number
  acceptedEdits: any[]
}) {
  console.log("rerendering TextEditor")

  const [editOverlayInitialized, setEditOverlayInitialized] = useState(false)
  const [editorContent, setEditorContent] = useState("")
  const overlayDiv = useRef<HTMLElement>(null)
  const [initialText] = useState(text)

  const initializeEditOverlay = () => {
    const editIframe = document.querySelector(
      ".tox-edit-area iframe.tox-edit-area__iframe"
    ) as HTMLIFrameElement
    console.log(editIframe)
    const suggestionHighlighter =
      editIframe &&
      editIframe.contentDocument.querySelector("suggestion-highlighter")
    if (editIframe && !suggestionHighlighter) {
      const overlayWrapper = document.createElement("suggestion-highlighter")
      overlayWrapper.style.position = "absolute"
      overlayWrapper.style.top = "0"
      overlayWrapper.style.pointerEvents = "none"
      overlayWrapper.style.width = "100%"
      overlayWrapper.style.height = "100%"

      //overlayWrapper.style.display = "none"
      const div = document.createElement("div")
      overlayWrapper.appendChild(div)
      overlayDiv.current = div
      const bodyStyle = editIframe.contentDocument.defaultView.getComputedStyle(
        editIframe.contentDocument.body
      )
      Array.from(bodyStyle).forEach((key) => {
        div.style.setProperty(key, bodyStyle.getPropertyValue(key))
      })
      div.style.display = "block"
      div.style.zIndex = "9999"
      // div.style.lineHeight = "1.4"
      // put margin on only the sides, and even change TinyMCE's margin, this is not ideal but is a decent fix to unpredictable margins
      div.style.margin = "0 1rem"
      editIframe.contentDocument.body.style.margin = "0 1rem"

      // there's a small offset on tinyMCE
      //div.style.marginTop = "2px"
      div.style.pointerEvents = "none"
      div.contentEditable = "false"
      div.style.position = "absolute"
      div.style.top = "0"
      div.style.left = "0"
      // div.style.color = "transparent"
      div.style.width = "unset"
      const style = document.createElement("style")
      style.innerHTML = `
      suggestion-highlighter > div  *, suggestion-highlighter *, suggestion-highlighter > div > * > * {
        color: transparent !important;
        visibility: hidden !important;
      }
      .selected-highlight {
        background-color: #0084cf !important;
      }
      `
      editIframe.contentDocument.head.appendChild(style)

      editIframe.contentDocument.documentElement.appendChild(overlayWrapper)
      console.log("initialized, now will make highlights")
      //onChange()
      setEditOverlayInitialized(true)
    }
    if (editIframe && suggestionHighlighter) {
      console.log("updating style!")
      const bodyStyle = editIframe.contentDocument.defaultView.getComputedStyle(
        editIframe.contentDocument.body
      )
      const div = overlayDiv.current
      Array.from(bodyStyle).forEach((key) => {
        div.style.setProperty(key, bodyStyle.getPropertyValue(key))
      })
      onChange()
    }
  }

  const onChange = () => {
    if (!(overlayDiv.current && overlayDiv.current.parentElement)) {
      console.log("no overlay div")
      //initializeEditOverlay()
      const editIframe = document.querySelector(
        "iframe.tox-edit-area__iframe"
      ) as HTMLIFrameElement
      console.log(editIframe)
      const overlayWrapper =
        editIframe &&
        editIframe.contentDocument.querySelector("suggestion-highlighter")

      if (overlayWrapper) overlayWrapper.appendChild(overlayDiv.current)
    }
    console.log("editor content!", editorContent[0], overlayDiv.current)
    if (overlayDiv.current) {
      // loop over each edit and highlight text
      overlayDiv.current.innerHTML = editorContent
      console.log(edits, "edits")
      for (const index in edits) {
        const edit = edits[index]
        try {
          const highlighter = new InstantSearch(
            overlayDiv.current,
            {
              text: edit.original,
              className:
                selectedEdit === parseInt(index)
                  ? "selected-highlight"
                  : "highlight",
            },
            () => setSelectedEdit(parseInt(index))
          )
          console.log(
            index,
            edit,
            highlighter,
            edit.original,
            editorContent,
            "lots of info for this highlight"
          )
          // @ts-expect-error
          window.InstantSearch = InstantSearch
          highlighter.highlight()
          console.log("highlighting", edit.original, highlighter)
        } catch (e) {
          console.log(e)
        }
      }
    }
  }

  useEffect(onChange, [editorContent, edits, selectedEdit])
  // useEffect(initializeEditOverlay, [edits])

  useEffect(() => {
    const editIframe = document.querySelector(
      "iframe.tox-edit-area__iframe"
    ) as HTMLIFrameElement
    if (editIframe) {
      const body = editIframe.contentDocument.body
      acceptedEdits.forEach((edit) => {
        const highlighter = new InstantSearch(body, {
          text: edit.original,
        })
        highlighter.highlight()
        highlighter.acceptSuggestion(edit.edit)
      })
    }
  }, [acceptedEdits])

  return (
    <div className="">
      <Editor
        apiKey="mq40kb92ixqjhgd0kxskf8pn5fg20ztn5fc5pml5mqzf37hn"
        onInit={(evt, editor) => {
          if (!editOverlayInitialized) initializeEditOverlay()
          setEditorContent(editor.getContent())
          setText(editor.getContent())
        }}
        initialValue={initialText}
        onKeyUp={(evt, editor) => {
          setEditorContent(editor.getContent())
          setText(editor.getContent())
        }}
        onChange={(evt, editor) => {
          setEditorContent(editor.getContent())
          setText(editor.getContent())
        }}
        init={{
          height: 500,
          menubar: false,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "help",
            "wordcount",
          ],
          toolbar:
            "undo redo | blocks | " +
            "bold italic forecolor | alignleft aligncenter " +
            "alignright alignjustify | bullist numlist outdent indent | " +
            "removeformat | help",
          content_style:
            "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
          skin: "naked",
          statusbar: false,
        }}
      />
    </div>
  )
}
