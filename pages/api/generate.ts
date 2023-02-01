import { NextApiHandler } from "next"
import { Configuration, OpenAIApi } from "openai"

const editFilter = (edit) => {
  if (!edit) return false
  if (edit.original && edit.edit && edit.suggestion) {
    return true
  }
  return false
}

function parseEdits(text: string) {
  const parsedEdits = []
  const edits = text.split("\n")
  let currentEdit = 0

  for (const line of edits) {
    try {
      console.log(line, currentEdit)
      if (line.startsWith("Edit #")) {
        currentEdit = parseInt(line.match(/Edit #(\d+):/)[1])
        parsedEdits[currentEdit] = {}
        const textWithTrailingQuote =
          line.split("Original Text - ")[1] || line.split("Original Text: ")[1]
        const lastQuoteIndex = textWithTrailingQuote.lastIndexOf(`"`)
        const firstQuoteIndex = textWithTrailingQuote.indexOf(`"`)
        if (firstQuoteIndex === -1 && lastQuoteIndex === -1) {
          parsedEdits[currentEdit].original = textWithTrailingQuote
          continue
        }
        parsedEdits[currentEdit].original = textWithTrailingQuote.slice(
          firstQuoteIndex + 1,
          lastQuoteIndex
        )
      }
      if (line.startsWith("Edited Text")) {
        const textWithTrailingQuote =
          line.split('Edited Text - "')[1] || line.split('Edited Text: "')[1]
        if (!textWithTrailingQuote) continue
        const quoteIndex = textWithTrailingQuote.lastIndexOf(`"`)
        parsedEdits[currentEdit].edit =
          quoteIndex !== -1
            ? textWithTrailingQuote.slice(0, quoteIndex)
            : textWithTrailingQuote
      }
      if (line.startsWith("Suggestion:")) {
        parsedEdits[currentEdit].suggestion = line.split("Suggestion: ")[1]
      }
    } catch (e) {
      console.error(e)
      return parsedEdits.filter(editFilter)
    }
  }
  return parsedEdits.filter(editFilter)
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

const basePromptPrefix = (prompt: string, text: string) => `
Prompt: Rewrite this text to use figurative language. Do not edit quotes. After writing the edit, list each edit made, including the original text, the edited text, and a detailed reason for editing. Write your reasons as suggestions (e.g., "Consider changing <something> in order to make it more interesting). You MUST list EVERY edit made to the text. List EVERY edit made to the text, in order. If listing an edit where something is being added and it absolutely does not have any relevant original text, write "Add after <preceding text>" for the original text.

Original Text:
Farewelling is all about celebrating a beautiful life, beautifully. Knowing how to write a eulogy is a part of keeping that person’s legacy alive and well. Write it with gusto. Deliver it with love and respect. And above all, know that whatever you write doesn’t have to be perfect. To craft a truly great eulogy, just follow the guidelines above. Combine a bit of structure with a dash of personal style, and you'll have a fitting tribute to share with friends and family.

Write out the edited text, followed by the list of edits:

Edited Text:

Farewelling is an opportunity to honour a life, masterfully. Crafting a eulogy is a way to preserve their memory and keep their legacy alive. Compose it with vigor. Relay it with reverence. Above all, accept that whatever you write doesn’t need to be flawless. To put together a truly remarkable eulogy, just abide by the rules above. Blend a pinch of structure with a sprinkle of individual flair, and you'll have a fitting tribute to share with loved ones.

Edit #1: Original Text - "is all about celebrating a beautiful life, beautifully."
Edited Text - "is an opportunity to honour a life, masterfully"
Suggestion: Consider using "opportunity" to change the tone and using "masterfully" to use more advanced language.

Edit #1: Original Text - "Knowing how to write a eulogy is a part of keeping that person’s legacy alive and well" 
Edited Text - "Crafting a eulogy is a way to preserve their memory and keep their legacy alive" 
Suggestion: Consider changing "write a eulogy" to "craft a eulogy" in order to give it a more personal touch. 

Edit #2: Original Text - "Write it with gusto" 
Edited Text - "Compose it with vigor" 
Suggestion: Consider changing "write it" to "compose it" in order to make it more poetic.

Edit #3: Original Text - "And above all, know that whatever you write doesn’t have to be perfect" 
Edited Text - "Above all, accept that whatever you write doesn’t need to be flawless" 
Suggestion: Consider changing "have to be perfect" to "need to be flawless" in order to make it sound more confident, and removing the redundant "And".

Edit #4: Original Text - "To craft a truly great eulogy, just follow the guidelines above" 
Edited Text - "To put together a truly remarkable eulogy, just abide by the rules above" 
Suggestion: Consider changing "craft a truly great eulogy" to "put together a truly remarkable eulogy" in order to make it sound more compelling.

Edit #5: Original Text - "Combine a bit of structure with a dash of personal style" 
Edited Text - "Blend a pinch of structure with a sprinkle of individual flair" 
Suggestion: Consider changing "combine a bit of structure" to "blend a pinch of structure" and "a dash of personal style" to "a sprinkle of individual flair" in order to make it sound more delicate.

Edit #6: Original Text -  "tribute to share with friends and family" 
Edited Text - "tribute to share with loved ones" 
Suggestion: Consider changing "friends and family" to "loved ones" in order to make it sound more personal.

END

Prompt: Rewrite this text to use figurative language. Do not edit quotes. After writing the edit, list each edit made, including the original text, the edited text, and a detailed reason for editing. Write your reasons as suggestions (e.g., "Consider changing <something> in order to make it more interesting). You MUST list EVERY edit made to the text. List EVERY edit made to the text, in order. If listing an edit where something is being added and it absolutely does not have any relevant original text, write "Add after <preceding text>" for the original text.

Original Text:
Thiel begins with the contrarian premise that we live in an age of technological stagnation, even if we’re too distracted by shiny mobile devices to notice. Information technology has improved rapidly, but there is no reason why progress should be limited to computers or Silicon Valley. Progress can be achieved in any industry or area of business. It comes from the most important skill that every leader must master: learning to think for yourself.

Doing what someone else already knows how to do takes the world from 1 to n, adding more of something familiar. But when you do something new, you go from 0 to 1. The next Bill Gates will not build an operating system. The next Larry Page or Sergey Brin won’t make a search engine. Tomorrow’s champions will not win by competing ruthlessly in today’s marketplace. They will escape competition altogether, because their businesses will be unique.

Write out the edited text, followed by the list of edits:

Edited Text: 
Thiel launches with the contrary notion that we exist in an era of technological monotony, even if we’re too preoccupied by glimmering electronic devices to remember. Information technology has progressed rapidly, yet there is no justification why success should be restricted to computers or Silicon Valley. Advancement can be accomplished in any sector or region of industry. It comes from the most crucial ability that each leader must master: learning to think independently.

Doing something that someone else already knows how to do hauls the world from 1 to n, adding more of what's already known. But when you make something novel, you go from 0 to 1. The next Bill Gates won't construct an operating system. The next Larry Page or Sergey Brin won't create a search engine. Tomorrow's victors won't triumph by being fiercely competitive in today's market. They will elude competition altogether, since their businesses will be one-of-a-kind.

Edit #1: Original Text - "we live in an age of technological stagnation"
Edited Text - "we exist in an era of technological monotony"
Suggestion: Consider changing "stagnation" to "monotony" in order to add a more poetic variation.

Edit #2: Original Text - "Progress can be achieved in any industry or area of business"
Edited Text - "Advancement can be accomplished in any sector or region of industry" 
Suggestion: Consider changing "industry or area of business" to "sector or region of industry" in order to use more precise language.

Edit #3: Original Text - "The next Bill Gates will not build an operating system" 
Edited Text - "The next Bill Gates won't construct an operating system" 
Suggestion: Consider changing "will not build" to "won't construct" in order to make it sound more casual.

Edit #4: Original Text - "will escape" 
Edited Text - "will elude" 
Suggestion: Consider changing "escape" to "elude" in order to use more advanced language.

Edit #5: Original Text - "because their businesses will be unique" 
Edited Text - "since their businesses will be one-of-a-kind" 
Suggestion: Consider changing "unique" to "one-of-a-kind" in order to make it more vivid. 

END

Prompt: Rewrite this text to ${prompt}. Do not edit quotes. After writing the edit, list each edit made, including the original text, the edited text, and a detailed reason for editing. Write your reasons as suggestions (e.g., "Consider changing <something> in order to make it more interesting). You MUST list EVERY edit made to the text. List EVERY edit made to the text, in order. Do not list edits if nothing changed. If listing an edit where something is being added and it absolutely does not have any relevant original text, write "Add after <preceding text>" for the original text.

Original Text:
${text}

Write out the edited text, followed by the list of edits:

Edited Text:`

const generateAction: NextApiHandler = async (req, res) => {
  if (!req.body.prompt || !req.body.text) {
    res.status(400).json({ error: "Missing prompt or text" })
    return
  }

  // Run first prompt
  // console.log(`API: ${basePromptPrefix(req.body.prompt, req.body.text)}`)

  const baseCompletion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: basePromptPrefix(req.body.prompt, req.body.text),
    temperature: 0.7,
    max_tokens: 1000,
  })

  const basePromptOutput = baseCompletion.data.choices.pop()
  console.log("OpenAI replied", basePromptOutput)
  res.status(200).json({
    test: "test",
    output: basePromptOutput,
    edits: parseEdits(basePromptOutput.text),
  })
}

export default generateAction
