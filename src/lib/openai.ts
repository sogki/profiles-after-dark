import { openai } from "@ai-sdk/openai"
import { generateText, generateObject } from "ai"
import { z } from "zod"

// OpenAI Moderation API wrapper
export async function moderateContent(content: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: content,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results[0]
  } catch (error) {
    console.error("OpenAI moderation error:", error)
    throw error
  }
}

// Advanced content analysis using GPT
export async function analyzeContentWithGPT(
  content: string,
  contentType: "profile" | "banner" | "comment" | "message",
) {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        isAppropriate: z.boolean(),
        confidenceScore: z.number().min(0).max(100),
        flags: z.array(z.string()),
        reasoning: z.string(),
        suggestedAction: z.enum(["approve", "flag", "hide", "remove"]),
        categories: z.array(
          z.enum([
            "harassment",
            "hate_speech",
            "spam",
            "inappropriate",
            "violence",
            "adult_content",
            "copyright",
            "misinformation",
          ]),
        ),
      }),
      prompt: `Analyze this ${contentType} content for moderation purposes:

Content: "${content}"

Please evaluate:
1. Is this content appropriate for a general audience?
2. What's your confidence level (0-100)?
3. What specific issues do you see (if any)?
4. What action would you recommend?
5. What categories of violations does this fall under?

Consider context - this is user-generated content for profile pictures and banners.
Be thorough but not overly strict. Focus on genuinely harmful content.`,
    })

    return object
  } catch (error) {
    console.error("GPT analysis error:", error)
    throw error
  }
}

// Image analysis using GPT-4 Vision
export async function analyzeImageContent(imageUrl: string, contentType: "profile" | "banner") {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${contentType} image for content moderation. 
              
              Check for:
              - Inappropriate or NSFW content
              - Violence or disturbing imagery
              - Hate symbols or offensive content
              - Copyright violations (recognizable characters/logos)
              - Spam or promotional content
              
              Respond with a JSON object containing:
              - isAppropriate (boolean)
              - confidenceScore (0-100)
              - flags (array of issues found)
              - reasoning (explanation)
              - suggestedAction (approve/flag/hide/remove)`,
            },
            {
              type: "image",
              image: imageUrl,
            },
          ],
        },
      ],
    })

    // Parse the JSON response
    try {
      return JSON.parse(text)
    } catch {
      // Fallback if JSON parsing fails
      return {
        isAppropriate: true,
        confidenceScore: 50,
        flags: [],
        reasoning: text,
        suggestedAction: "flag",
      }
    }
  } catch (error) {
    console.error("Image analysis error:", error)
    throw error
  }
}

// Spam detection using GPT
export async function detectSpam(content: string, userHistory?: any) {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        isSpam: z.boolean(),
        spamScore: z.number().min(0).max(100),
        spamType: z.enum(["promotional", "repetitive", "bot", "phishing", "none"]),
        reasoning: z.string(),
      }),
      prompt: `Analyze this content for spam:

Content: "${content}"
${userHistory ? `User History: ${JSON.stringify(userHistory)}` : ""}

Determine:
1. Is this spam?
2. Spam likelihood score (0-100)
3. What type of spam is it?
4. Why do you think this?

Consider patterns like:
- Excessive promotional language
- Repetitive content
- Suspicious links
- Bot-like behavior
- Phishing attempts`,
    })

    return object
  } catch (error) {
    console.error("Spam detection error:", error)
    throw error
  }
}

// Batch content analysis
export async function batchAnalyzeContent(contents: Array<{ id: string; content: string; type: string }>) {
  const results = []

  for (const item of contents) {
    try {
      const [moderationResult, gptAnalysis] = await Promise.all([
        moderateContent(item.content),
        analyzeContentWithGPT(item.content, item.type as any),
      ])

      results.push({
        id: item.id,
        moderation: moderationResult,
        analysis: gptAnalysis,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`Error analyzing content ${item.id}:`, error)
      results.push({
        id: item.id,
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    }
  }

  return results
}
