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

const getRangeDataFromElement = (el: ChildNode, start: number, end: number) => {
  const rangeData: {
    endNode: ChildNode
    endOffset: number
    startNode: ChildNode
    startOffset: number
    ranges: Range[]
  } = {
    endNode: null,
    endOffset: null,
    startNode: null,
    startOffset: null,
    ranges: [],
  }
  // ranges get passed up to the function result to be marked at once, so that the DOM is not messed with while it's still being read
  let ranges = []
  Array.from(el.childNodes)
    .map((e) => e.textContent)
    .reduce<number>((accumulator, currentValue, index) => {
      if (end < accumulator + currentValue.length && end >= accumulator) {
        console.log("end at", currentValue, index, end - accumulator)
        if (el.childNodes[index].nodeType === 3) {
          rangeData.endNode = el.childNodes[index]
          rangeData.endOffset = end - accumulator

          // create a range surrounding the part of the end node that needs to be selected
          const range = new Range()
          range.setStart(el.childNodes[index], rangeData.endOffset - start)
          range.setEnd(el.childNodes[index], rangeData.endOffset)
          ranges.push(range)
        } else {
          const newEnd = end - accumulator
          const length = end - start
          console.log("start offset", {
            start,
            end,
            newEnd,
            length,
            newStart: newEnd > length ? newEnd - length : 0,
            textContent: el.childNodes[index].textContent,
            fullTextContent: el.textContent,
          })

          const trueRangeData = getRangeDataFromElement(
            el.childNodes[index],
            newEnd > length ? newEnd - length : 0,
            newEnd
          )
          ranges = [...ranges, ...trueRangeData.ranges]
          rangeData.endNode = trueRangeData.endNode
          rangeData.endOffset = trueRangeData.endOffset
        }
      }

      // highlight nodes, except the end node which is highlighted above in the code
      if (rangeData.startNode && !rangeData.endNode) {
        const range = new Range()
        range.selectNode(el.childNodes[index])
        ranges.push(range)
        range.detach()
        console.log(el.childNodes[index].textContent, "highlighted")
      }

      if (start <= accumulator + currentValue.length && start >= accumulator) {
        console.log("start at", currentValue, index)
        if (el.childNodes[index].nodeType === 3) {
          rangeData.startNode = el.childNodes[index]
          rangeData.startOffset = start - accumulator

          // create a range surrounding the part of the start node that needs to be selected
          const range = new Range()
          range.selectNode(el.childNodes[index])
          range.setStart(el.childNodes[index], rangeData.startOffset)
          range.setEnd(
            el.childNodes[index],
            Math.min(currentValue.length, end - accumulator)
          )
          console.log(
            rangeData.startOffset,
            start,
            accumulator,
            range.toString(),
            "start offset"
          )
          ranges.push(range)
        } else {
          const length = end - start
          const newStart = start - accumulator
          const trueRangeData = getRangeDataFromElement(
            el.childNodes[index],
            newStart,
            currentValue.length > newStart + length
              ? newStart + length
              : currentValue.length
          )
          ranges = [...ranges, ...trueRangeData.ranges]
          rangeData.startNode = trueRangeData.startNode
          rangeData.startOffset = trueRangeData.startOffset
        }
      }

      return accumulator + currentValue.length
    }, 0)

  rangeData.ranges = ranges
  return rangeData
}

export default function TextEditor({
  text,
  setText,
  edits,
  setSelectedEdit,
}: {
  text: string
  setText: (text: string) => void
  edits: { original: string; suggestion: string; edit: string }[]
  setSelectedEdit: (edit: number) => void
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
      try {
        editIframe.contentDocument
          .querySelectorAll("suggestion-highlighter")
          .forEach((el) => el.remove())
      } catch (e) {
        console.log(e)
      }
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
      div.contentEditable = "false"
      div.style.position = "absolute"
      div.style.top = "0"
      div.style.left = "0"
      div.style.color = "transparent"
      const style = document.createElement("style")
      style.innerHTML = `
      suggestion-highlighter > div  *, suggestion-highlighter *, suggestion-highlighter > div > * > * {
        color: transparent !important;
        visibility: hidden !important;
      }
      `
      editIframe.contentDocument.head.appendChild(style)

      editIframe.contentDocument.documentElement.appendChild(overlayWrapper)
      setEditOverlayInitialized(true)
    }
  }

  const onChange = () => {
    if (overlayDiv.current) {
      const editIframe = document.querySelector(
        ".tox-edit-area iframe.tox-edit-area__iframe"
      ) as HTMLIFrameElement

      // loop over each edit and highlight text
      overlayDiv.current.innerHTML = editorContent

      for (const index in edits) {
        const edit = edits[index]
        console.log(edit, "edit")
        try {
          const textToSelect = edit.original

          //const start = overlayDiv.current.textContent.indexOf(textToSelect)
          // if (start === -1) return
          // const end = start + textToSelect.length
          // window.InstantSearch = InstantSearch
          console.log(InstantSearch, overlayDiv.current)
          const highlighter = new InstantSearch(
            overlayDiv.current,
            {
              text: edit.original,
            },
            () => setSelectedEdit(parseInt(index))
          )
          highlighter.highlight()
          highlighter.search(overlayDiv.current)

          // const range = new Range()

          /*  const rangeData = getRangeDataFromElement(
            overlayDiv.current,
            start,
            end
          
          console.log("rangeData", rangeData)
          rangeData.ranges.forEach((range) => {
            const mark = document.createElement("mark")
            mark.style.backgroundColor = "#ff000059"
            mark.style.borderBottom = "1px solid yellow"
            mark.onclick = () => {
              console.log("clicked", edit)
            }
            mark.style.pointerEvents = "auto"
            range.surroundContents(mark)
            range.detach()
          })
          /*  const range = new Range()
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
        }*/
          /* const editorRange = new Range()
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
        range.surroundContents(mark)*/
        } catch (e) {
          console.log(e)
        }
      }
    }
  }
  useEffect(onChange, [editorContent, edits])
  useEffect(initializeEditOverlay, [edits])
  useEffect(() => {
    const editIframe = document.querySelector(
      "iframe.tox-edit-area__iframe"
    ) as HTMLIFrameElement
    if (editIframe)
      editIframe.contentWindow.addEventListener(
        "resize",
        debounce(() => {
          initializeEditOverlay()
          onChange()
          console.log("debounced")
        }, 1000)
      )
  }, [])

  return (
    <div className="border-2">
      <Editor
        apiKey="mq40kb92ixqjhgd0kxskf8pn5fg20ztn5fc5pml5mqzf37hn"
        onInit={(evt, editor) => {
          setEditorRef(editor)
          if (!editOverlayInitialized) initializeEditOverlay()
          setEditorContent(editor.getContent())
          setText(editor.getContent())
        }}
        initialValue={initialText}
        onKeyUp={(evt, editor) => {
          console.log(editor.getContent())
          setEditorContent(editor.getContent())
          setText(editor.getContent())
        }}
        onChange={(evt, editor) => {
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
    </div>
  )
}
