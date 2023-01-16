import React, { useEffect, useRef, useState } from "react"
import { Editor } from "@tinymce/tinymce-react"
import { useLocalStorage } from "../lib/useLocalStorage"

const textToSelect = "the quick brown fox"

const getRangeDataFromElement = (el: ChildNode, start: number, end: number) => {
  const rangeData = {
    endNode: null,
    endOffset: null,
    startNode: null,
    startOffset: null,
  }
  Array.from(el.childNodes)
    .map((e) => e.textContent)
    .reduce<number>((accumulator, currentValue, index) => {
      console.log(
        accumulator,
        currentValue,
        index,
        el.childNodes[index],
        start,
        end
      )
      if (start < accumulator + currentValue.length && start > accumulator) {
        console.log("start at", currentValue, index)
        if (el.childNodes[index].nodeType === 3) {
          rangeData.startNode = el.childNodes[index]
          rangeData.startOffset = start - accumulator
        } else {
          const trueRangeData = getRangeDataFromElement(
            el.childNodes[index],
            start - accumulator,
            currentValue.length
          )
          rangeData.startNode = trueRangeData.startNode
          rangeData.startOffset = trueRangeData.startOffset
        }
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
      return accumulator + currentValue.length
    }, 0)
  return rangeData
}
export default function TextEditor({
  text,
  setText,
  edits,
}: {
  text: string
  setText: (text: string) => void
  edits: { original: string; suggestion: string; edit: string }[]
}) {
  const [editorRef, setEditorRef] = useState(null)
  const [editOverlayInitialized, setEditOverlayInitialized] = useState(false)
  const [editorContent, setEditorContent] = useState("")
  const overlayDiv = useRef<HTMLElement>(null)
  const [initialText] = useState(text)

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
      div.style.lineHeight = "1.4"
      // put margin on only the sides
      div.style.margin = "0 1rem"
      // there's a small offset on tinyMCE
      div.style.marginTop = "2px"
      div.style.pointerEvents = "none"
      div.style.position = "absolute"
      div.style.top = "0"
      div.style.left = "0"
      div.style.color = "transparent"
      editIframe.contentDocument.documentElement.appendChild(overlayWrapper)
      setEditOverlayInitialized(true)
    }
  }
  const onChange = () => {
    if (overlayDiv.current) {
      // loop over each edit and highlight text
      for (const edit of edits) {
        try {
          const textToSelect = edit.original
          overlayDiv.current.innerHTML = editorContent

          const start = overlayDiv.current.textContent.indexOf(textToSelect)
          const end = start + textToSelect.length
          // const range = new Range()

          const rangeData = getRangeDataFromElement(
            overlayDiv.current,
            start,
            end
          )
          const range = new Range()
          range.setStart(rangeData.startNode, rangeData.startOffset)
          range.setEnd(rangeData.endNode, rangeData.endOffset)
          console.log("range", range)
          const mark = document.createElement("mark")
          mark.style.backgroundColor = "#ffff0082"
          mark.style.borderBottom = "1px solid yellow"
          const editIframe = document.querySelector(
            ".tox-edit-area iframe.tox-edit-area__iframe"
          ) as HTMLIFrameElement

          editIframe.contentDocument.body.onclick = () => {
            const rangeData = getRangeDataFromElement(
              editIframe.contentDocument.body,
              start,
              end
            )
            const editorRange = new Range()
            editorRange.setStart(rangeData.startNode, rangeData.startOffset)
            editorRange.setEnd(rangeData.endNode, rangeData.endOffset)
            console.log("editorrange", editorRange)

            if (
              editorRange.comparePoint(
                editIframe.contentWindow.getSelection().anchorNode,
                editIframe.contentWindow.getSelection().anchorOffset
              ) === 0
            ) {
              alert("clicked")
            }
          }
          range.surroundContents(mark)
        } catch (e) {
          console.log(e)
        }
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
        initialValue={initialText}
        onKeyUp={(evt, editor) => {
          console.log(editor.getContent())
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
    </>
  )
}
