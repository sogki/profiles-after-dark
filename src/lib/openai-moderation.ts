import { openai } from "@ai-sdk/openai"
import { generateText, generateObject } from "ai"
import { z } from "zod"

// Schema for content moderation results
const ModerationResultSchema = z.object({
  isAppropriate: z.boolean(),
  confidenceScore: z.number().min(0).max(100),
  flags: z.array(z.string()),
  severity: z.enum(["low", "medium", "high", "critical"]),
  reasoning: z.string(),
  suggestedAction: z.enum(["approve", "flag", "hide", "remove", "warn_user", "restrict_user", "ban_user"]),
})

export type ModerationResult = z.infer<typeof ModerationResultSchema>

// Content moderation using OpenAI
export async function moderateContent(content: {
  type: "text" | "image" | "profile" | "banner"
  data: string
  title?: string
  tags?: string[]
  username?: string
}): Promise<ModerationResult> {
  try {
    const prompt = `
You are an AI content moderator for a profile picture and banner sharing platform. 
Analyze the following content and determine if it's appropriate for our community.

Content Type: ${content.type}
${content.title ? `Title: ${content.title}` : ""}
${content.username ? `Username: ${content.username}` : ""}
${content.tags ? `Tags: ${content.tags.join(", ")}` : ""}
${content.type === "text" ? `Text Content: ${content.data}` : `Image URL: ${content.data}`}

Community Guidelines:
- No explicit sexual content
- No violence or gore
- No hate speech or discrimination
- No spam or misleading content
- No copyrighted material without permission
- No personal information or doxxing
- Keep content family-friendly

Analyze this content and provide a detailed moderation assessment.
`

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: ModerationResultSchema,
      prompt,
    })

    return result.object
  } catch (error) {
    console.error("OpenAI moderation error:", error)
    // Fallback to conservative moderation
    return {
      isAppropriate: false,
      confidenceScore: 50,
      flags: ["ai_error"],
      severity: "medium",
      reasoning: "AI moderation service temporarily unavailable",
      suggestedAction: "flag",
    }
  }
}

// Text-specific moderation using OpenAI's moderation endpoint
export async function moderateText(text: string): Promise<{
  flagged: boolean
  categories: Record<string, boolean>
  categoryScores: Record<string, number>
}> {
  try {
    // Use OpenAI's built-in moderation endpoint
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const result = data.results[0]

    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
    }
  } catch (error) {
    console.error("OpenAI text moderation error:", error)
    return {
      flagged: false,
      categories: {},
      categoryScores: {},
    }
  }
}

// Spam detection using AI
export async function detectSpam(content: {
  title?: string
  description?: string
  tags?: string[]
  username?: string
}): Promise<{
  isSpam: boolean
  confidence: number
  reasons: string[]
}> {
  try {
    const contentText = [content.title, content.description, content.tags?.join(" "), content.username]
      .filter(Boolean)
      .join(" ")

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
Analyze the following content for spam indicators:

Content: "${contentText}"

Look for these spam patterns:
- Excessive promotional language
- Repeated keywords or phrases
- Suspicious links or contact information
- Generic or low-quality content
- Misleading titles or descriptions
- Bot-like behavior patterns

Respond with a JSON object containing:
- isSpam: boolean
- confidence: number (0-100)
- reasons: array of specific reasons if spam detected

Content to analyze: ${contentText}
`,
    })

    try {
      const result = JSON.parse(text)
      return {
        isSpam: result.isSpam || false,
        confidence: result.confidence || 0,
        reasons: result.reasons || [],
      }
    } catch {
      return {
        isSpam: false,
        confidence: 0,
        reasons: [],
      }
    }
  } catch (error) {
    console.error("Spam detection error:", error)
    return {
      isSpam: false,
      confidence: 0,
      reasons: ["AI service error"],
    }
  }
}

// Generate content tags using AI
export async function generateContentTags(content: {
  title?: string
  imageUrl?: string
  type: "profile" | "banner" | "pair"
}): Promise<string[]> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
Generate relevant tags for this ${content.type} content:

${content.title ? `Title: ${content.title}` : ""}
${content.imageUrl ? `Image URL: ${content.imageUrl}` : ""}

Generate 5-10 relevant tags that describe:
- Visual style (e.g., minimalist, colorful, dark, aesthetic)
- Theme (e.g., gaming, anime, nature, abstract)
- Colors (e.g., blue, purple, rainbow)
- Mood (e.g., cool, warm, energetic, calm)

Return only the tags as a comma-separated list, no explanations.
`,
    })

    return text
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
  } catch (error) {
    console.error("Tag generation error:", error)
    return []
  }
}

// Analyze user behavior patterns
export async function analyzeUserBehavior(userData: {
  username: string
  uploadCount: number
  recentUploads: Array<{
    title: string
    tags: string[]
    created_at: string
  }>
  reportCount: number
}): Promise<{
  riskLevel: "low" | "medium" | "high"
  confidence: number
  concerns: string[]
  recommendations: string[]
}> {
  try {
    const recentActivity = userData.recentUploads
      .map((upload) => `"${upload.title}" (${upload.tags.join(", ")})`)
      .join(", ")

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
Analyze this user's behavior pattern for potential risks:

Username: ${userData.username}
Total Uploads: ${userData.uploadCount}
Recent Reports: ${userData.reportCount}
Recent Uploads: ${recentActivity}

Look for patterns indicating:
- Spam behavior (repetitive content, low quality)
- Policy violations (inappropriate content themes)
- Bot-like activity (rapid uploads, generic titles)
- Community guidelines violations

Respond with JSON containing:
- riskLevel: "low", "medium", or "high"
- confidence: number (0-100)
- concerns: array of specific concerns
- recommendations: array of suggested actions

User data: ${JSON.stringify(userData)}
`,
    })

    try {
      const result = JSON.parse(text)
      return {
        riskLevel: result.riskLevel || "low",
        confidence: result.confidence || 0,
        concerns: result.concerns || [],
        recommendations: result.recommendations || [],
      }
    } catch {
      return {
        riskLevel: "low",
        confidence: 0,
        concerns: [],
        recommendations: [],
      }
    }
  } catch (error) {
    console.error("User behavior analysis error:", error)
    return {
      riskLevel: "low",
      confidence: 0,
      concerns: ["AI analysis unavailable"],
      recommendations: [],
    }
  }
}
