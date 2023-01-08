import React, { useEffect, useRef, useState } from "react"
import { Editor } from "@tinymce/tinymce-react"

const textToSelect = "the quick brown fox"

const getRangeDataFromElement = (
  el: HTMLElement,
  start: number,
  end: number
) => {
  const rangeData = {
    endNode: null,
    endOffset: null,
    startNode: null,
    startOffset: null,
  }
  Array.from(el.childNodes)
    .map((e) => e.textContent)
    .reduce<number>((accumulator, currentValue, index) => {
      if (start < accumulator + currentValue.length && start > accumulator) {
        console.log("start at", currentValue, index)
        rangeData.startNode = index
        rangeData.startOffset = start - accumulator
      }
      if (end < accumulator + currentValue.length && end > accumulator) {
        console.log("end at", currentValue, index, end - accumulator)
        if (el.childNodes[index].nodeType === 3) {
          rangeData.endNode = el.childNodes[index]
          rangeData.endOffset = end - accumulator
        } else {
          const trueRangeData = getRangeDataFromElement(
            el.childNodes[index],
            0,
            end - accumulator
          )
          rangeData.endNode = trueRangeData.endNode
          rangeData.endOffset = trueRangeData.endOffset
        }
      }
    }, 0)
  return rangeData
}
export default function TextEditor() {
  const [editorRef, setEditorRef] = useState(null)
  const [editOverlayInitialized, setEditOverlayInitialized] = useState(false)
  const [editorContent, setEditorContent] = useState("")
  const overlayDiv = useRef<HTMLElement>(null)

  const log = () => {
    if (editorRef) {
      console.log(editorRef.getContent())
    }
  }
  const initializeEditOverlay = () => {
    const editIframe = document.querySelector(
      ".tox-edit-area iframe.tox-edit-area__iframe"
    ) as HTMLIFrameElement
    console.log(editIframe)
    if (editIframe) {
      const overlayWrapper = document.createElement("suggestion-highlighter")
      overlayWrapper.style.display = "none"
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
      // put margin on only the sides
      div.style.margin = "0 1rem"
      // there's a small offset on tinyMCE
      div.style.marginTop = "2px"
      div.style.pointerEvents = "none"
      div.style.position = "absolute"
      div.style.top = "0"
      div.style.left = "0"
      editIframe.contentDocument.documentElement.appendChild(overlayWrapper)
      setEditOverlayInitialized(true)
    }
  }
  const onChange = () => {
    if (overlayDiv.current) {
      try {
        overlayDiv.current.innerHTML = editorContent

        const start = editorContent.indexOf(textToSelect)
        const end = start + textToSelect.length
        // const range = new Range()

        const rangeData = getRangeDataFromElement(
          overlayDiv.current,
          start,
          end
        )
        console.log("rangeData", rangeData)
        // range.surroundContents(document.createElement("mark"))
      } catch (e) {
        console.log(e)
      }
    }
  }
  useEffect(onChange, [editorContent])

  return (
    <>
      <Editor
        apiKey="mq40kb92ixqjhgd0kxskf8pn5fg20ztn5fc5pml5mqzf37hn"
        onInit={(evt, editor) => {
          setEditorRef(editor)
          if (!editOverlayInitialized) initializeEditOverlay()
        }}
        initialValue={""}
        onKeyUp={(evt, editor) => {
          console.log(editor.getContent())
          setEditorContent(editor.getContent())
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
      <button onClick={log}>Log editor content</button>
    </>
  )
}
