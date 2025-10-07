import { openai } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { supabase } from "./supabase";

// Enhanced moderation schemas
const ContentAnalysisSchema = z.object({
  isAppropriate: z.boolean(),
  confidenceScore: z.number().min(0).max(100),
  flags: z.array(z.string()),
  severity: z.enum(["low", "medium", "high", "critical"]),
  reasoning: z.string(),
  suggestedActions: z.array(z.enum([
    "approve", "flag", "hide", "remove", "warn_user", 
    "restrict_user", "ban_user", "escalate_to_admin"
  ])),
  riskScore: z.number().min(0).max(100),
  categories: z.array(z.string()),
  autoModeration: z.boolean(),
  requiresHumanReview: z.boolean()
});

const UserBehaviorAnalysisSchema = z.object({
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(100),
  concerns: z.array(z.string()),
  recommendations: z.array(z.string()),
  behaviorPattern: z.string(),
  trustScore: z.number().min(0).max(100),
  moderationHistory: z.array(z.string())
});

const ModerationActionSchema = z.object({
  action: z.string(),
  reason: z.string(),
  severity: z.string(),
  automated: z.boolean(),
  confidence: z.number(),
  requiresApproval: z.boolean()
});

export type ContentAnalysis = z.infer<typeof ContentAnalysisSchema>;
export type UserBehaviorAnalysis = z.infer<typeof UserBehaviorAnalysisSchema>;
export type ModerationAction = z.infer<typeof ModerationActionSchema>;

// Enhanced content moderation with multiple AI models
export async function analyzeContent(content: {
  type: "text" | "image" | "profile" | "banner" | "emoji_combo";
  data: string;
  title?: string;
  tags?: string[];
  username?: string;
  userId?: string;
  metadata?: Record<string, any>;
}): Promise<ContentAnalysis> {
  try {
    // Get user's moderation history for context
    const userHistory = await getUserModerationHistory(content.userId);
    
    const prompt = `
You are an advanced AI content moderator for a profile picture and banner sharing platform. 
Analyze the following content with enhanced context and provide a comprehensive assessment.

Content Type: ${content.type}
${content.title ? `Title: ${content.title}` : ""}
${content.username ? `Username: ${content.username}` : ""}
${content.tags ? `Tags: ${content.tags.join(", ")}` : ""}
${content.type === "text" ? `Text Content: ${content.data}` : `Image URL: ${content.data}`}

User Moderation History: ${JSON.stringify(userHistory)}

Enhanced Analysis Guidelines:
1. Content Appropriateness:
   - No explicit sexual content (including suggestive imagery)
   - No violence, gore, or disturbing content
   - No hate speech, discrimination, or harassment
   - No spam, scams, or misleading content
   - No copyrighted material without permission
   - No personal information or doxxing
   - Family-friendly content only

2. Quality Assessment:
   - Visual quality and aesthetic appeal
   - Originality and creativity
   - Community value and engagement potential
   - Technical quality (resolution, composition)

3. Context Analysis:
   - User's posting history and patterns
   - Community guidelines compliance
   - Potential for harm or offense
   - Cultural sensitivity

4. Risk Factors:
   - Previous violations by user
   - Content that could be misinterpreted
   - Potential for escalation
   - Community impact

Provide a comprehensive analysis with specific reasoning.
`;

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: ContentAnalysisSchema,
      prompt,
    });

    // Store analysis in database for learning
    await storeModerationAnalysis(content, result.object);

    return result.object;
  } catch (error) {
    console.error("Enhanced content analysis error:", error);
    
    // Fallback to conservative analysis
    return {
      isAppropriate: false,
      confidenceScore: 50,
      flags: ["analysis_error"],
      severity: "medium",
      reasoning: "AI analysis service temporarily unavailable",
      suggestedActions: ["flag"],
      riskScore: 50,
      categories: ["unknown"],
      autoModeration: false,
      requiresHumanReview: true
    };
  }
}

// Multi-model text moderation
export async function moderateTextAdvanced(text: string, context?: {
  username?: string;
  userId?: string;
  contentType?: string;
}): Promise<{
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
  sentiment: string;
  toxicity: number;
  riskLevel: string;
}> {
  try {
    // Use OpenAI's moderation endpoint
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: "text-moderation-latest"
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.results[0];

    // Enhanced analysis with sentiment
    const sentimentAnalysis = await analyzeSentiment(text);
    
    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
      sentiment: sentimentAnalysis.sentiment,
      toxicity: sentimentAnalysis.toxicity,
      riskLevel: calculateRiskLevel(result.category_scores, sentimentAnalysis.toxicity)
    };
  } catch (error) {
    console.error("Advanced text moderation error:", error);
    return {
      flagged: false,
      categories: {},
      categoryScores: {},
      sentiment: "neutral",
      toxicity: 0,
      riskLevel: "low"
    };
  }
}

// Image content analysis using AI vision
export async function analyzeImageContent(imageUrl: string, context?: {
  title?: string;
  tags?: string[];
  username?: string;
}): Promise<{
  isAppropriate: boolean;
  confidence: number;
  detectedObjects: string[];
  contentDescription: string;
  riskFactors: string[];
  suggestedTags: string[];
}> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
Analyze this image for content moderation purposes:

Image URL: ${imageUrl}
${context?.title ? `Title: ${context.title}` : ""}
${context?.tags ? `Tags: ${context.tags.join(", ")}` : ""}
${context?.username ? `Username: ${context.username}` : ""}

Provide a detailed analysis including:
1. Object detection and scene description
2. Content appropriateness assessment
3. Potential risk factors
4. Suggested tags for better categorization
5. Confidence level in the assessment

Focus on:
- NSFW content detection
- Violence or disturbing imagery
- Hate symbols or inappropriate text
- Copyright concerns
- Quality and aesthetic value
- Community guidelines compliance

Respond with a JSON object containing:
- isAppropriate: boolean
- confidence: number (0-100)
- detectedObjects: array of detected objects
- contentDescription: detailed description
- riskFactors: array of potential risks
- suggestedTags: array of suggested tags
`,
    });

    try {
      const result = JSON.parse(text);
      return {
        isAppropriate: result.isAppropriate || false,
        confidence: result.confidence || 0,
        detectedObjects: result.detectedObjects || [],
        contentDescription: result.contentDescription || "",
        riskFactors: result.riskFactors || [],
        suggestedTags: result.suggestedTags || []
      };
    } catch {
      return {
        isAppropriate: false,
        confidence: 0,
        detectedObjects: [],
        contentDescription: "Analysis failed",
        riskFactors: ["analysis_error"],
        suggestedTags: []
      };
    }
  } catch (error) {
    console.error("Image analysis error:", error);
    return {
      isAppropriate: false,
      confidence: 0,
      detectedObjects: [],
      contentDescription: "Analysis failed",
      riskFactors: ["analysis_error"],
      suggestedTags: []
    };
  }
}

// Advanced spam detection with pattern recognition
export async function detectSpamAdvanced(content: {
  title?: string;
  description?: string;
  tags?: string[];
  username?: string;
  userId?: string;
  uploadFrequency?: number;
}): Promise<{
  isSpam: boolean;
  confidence: number;
  reasons: string[];
  spamType: string;
  riskScore: number;
  recommendations: string[];
}> {
  try {
    const contentText = [
      content.title, 
      content.description, 
      content.tags?.join(" "), 
      content.username
    ].filter(Boolean).join(" ");

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
Advanced spam detection analysis:

Content: "${contentText}"
Username: ${content.username || "Unknown"}
Upload Frequency: ${content.uploadFrequency || 0} per hour

Analyze for these spam patterns:
1. Repetitive content or keywords
2. Promotional language and marketing speak
3. Suspicious links or contact information
4. Generic or low-quality content
5. Bot-like behavior patterns
6. Misleading titles or descriptions
7. Excessive use of special characters
8. Copy-paste behavior indicators
9. Unusual posting patterns
10. Community guideline violations

Provide detailed analysis with:
- isSpam: boolean
- confidence: number (0-100)
- reasons: array of specific spam indicators
- spamType: type of spam detected
- riskScore: overall risk score (0-100)
- recommendations: suggested actions

Content to analyze: ${contentText}
`,
    });

    try {
      const result = JSON.parse(text);
      return {
        isSpam: result.isSpam || false,
        confidence: result.confidence || 0,
        reasons: result.reasons || [],
        spamType: result.spamType || "unknown",
        riskScore: result.riskScore || 0,
        recommendations: result.recommendations || []
      };
    } catch {
      return {
        isSpam: false,
        confidence: 0,
        reasons: [],
        spamType: "unknown",
        riskScore: 0,
        recommendations: []
      };
    }
  } catch (error) {
    console.error("Advanced spam detection error:", error);
    return {
      isSpam: false,
      confidence: 0,
      reasons: ["analysis_error"],
      spamType: "unknown",
      riskScore: 0,
      recommendations: []
    };
  }
}

// User behavior analysis with machine learning
export async function analyzeUserBehavior(userId: string): Promise<UserBehaviorAnalysis> {
  try {
    // Get comprehensive user data
    const userData = await getUserComprehensiveData(userId);
    
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
Comprehensive user behavior analysis:

User ID: ${userId}
Username: ${userData.username}
Account Age: ${userData.accountAge} days
Total Uploads: ${userData.uploadCount}
Recent Reports: ${userData.reportCount}
Moderation Actions: ${userData.moderationActions}
Upload Patterns: ${JSON.stringify(userData.uploadPatterns)}
Content Quality: ${userData.contentQuality}
Community Engagement: ${userData.communityEngagement}

Analyze for:
1. Risk assessment and threat level
2. Behavioral patterns and anomalies
3. Content quality trends
4. Community guideline compliance
5. Potential for future violations
6. Trust and reputation factors
7. Moderation history impact
8. User engagement patterns

Provide detailed analysis with:
- riskLevel: "low", "medium", "high", or "critical"
- confidence: number (0-100)
- concerns: array of specific concerns
- recommendations: array of suggested actions
- behaviorPattern: description of behavior pattern
- trustScore: overall trust score (0-100)
- moderationHistory: array of past actions

User data: ${JSON.stringify(userData)}
`,
    });

    try {
      const result = JSON.parse(text);
      return {
        riskLevel: result.riskLevel || "low",
        confidence: result.confidence || 0,
        concerns: result.concerns || [],
        recommendations: result.recommendations || [],
        behaviorPattern: result.behaviorPattern || "unknown",
        trustScore: result.trustScore || 50,
        moderationHistory: result.moderationHistory || []
      };
    } catch {
      return {
        riskLevel: "low",
        confidence: 0,
        concerns: [],
        recommendations: [],
        behaviorPattern: "unknown",
        trustScore: 50,
        moderationHistory: []
      };
    }
  } catch (error) {
    console.error("User behavior analysis error:", error);
    return {
      riskLevel: "low",
      confidence: 0,
      concerns: ["analysis_error"],
      recommendations: [],
      behaviorPattern: "unknown",
      trustScore: 50,
      moderationHistory: []
    };
  }
}

// Automated moderation actions
export async function executeModerationAction(
  action: string,
  targetId: string,
  reason: string,
  moderatorId: string,
  automated: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const actionData = {
      action,
      target_id: targetId,
      reason,
      moderator_id: moderatorId,
      automated,
      created_at: new Date().toISOString()
    };

    // Log the action
    await supabase.from('moderation_actions').insert([actionData]);

    // Execute specific action based on type
    switch (action) {
      case 'hide_content':
        await hideContent(targetId);
        break;
      case 'remove_content':
        await removeContent(targetId);
        break;
      case 'warn_user':
        await warnUser(targetId, reason);
        break;
      case 'restrict_user':
        await restrictUser(targetId, reason);
        break;
      case 'ban_user':
        await banUser(targetId, reason);
        break;
      default:
        console.warn(`Unknown moderation action: ${action}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Moderation action execution error:", error);
    return { success: false, error: error.message };
  }
}

// Helper functions
async function getUserModerationHistory(userId?: string): Promise<any[]> {
  if (!userId) return [];
  
  try {
    const { data } = await supabase
      .from('moderation_logs')
      .select('*')
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    return data || [];
  } catch (error) {
    console.error("Error fetching user moderation history:", error);
    return [];
  }
}

async function getUserComprehensiveData(userId: string): Promise<any> {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get upload statistics
    const { data: uploads } = await supabase
      .from('profiles')
      .select('created_at, download_count')
      .eq('user_id', userId);

    // Get reports against user
    const { data: reports } = await supabase
      .from('reports')
      .select('*')
      .eq('reported_user_id', userId);

    // Get moderation actions
    const { data: actions } = await supabase
      .from('moderation_actions')
      .select('*')
      .eq('target_id', userId);

    return {
      username: profile?.username || 'Unknown',
      accountAge: profile ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      uploadCount: uploads?.length || 0,
      reportCount: reports?.length || 0,
      moderationActions: actions?.length || 0,
      uploadPatterns: analyzeUploadPatterns(uploads || []),
      contentQuality: calculateContentQuality(uploads || []),
      communityEngagement: calculateEngagement(profile)
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return {};
  }
}

async function storeModerationAnalysis(content: any, analysis: ContentAnalysis): Promise<void> {
  try {
    await supabase.from('auto_moderation_scans').insert([{
      content_id: content.data,
      content_type: content.type,
      scan_type: 'ai_analysis',
      status: 'completed',
      confidence_score: analysis.confidenceScore,
      flags: analysis.flags,
      action_taken: analysis.suggestedActions[0] || 'none',
      created_at: new Date().toISOString()
    }]);
  } catch (error) {
    console.error("Error storing moderation analysis:", error);
  }
}

async function analyzeSentiment(text: string): Promise<{ sentiment: string; toxicity: number }> {
  try {
    const { text: result } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Analyze the sentiment and toxicity of this text: "${text}"\n\nRespond with JSON: {"sentiment": "positive/negative/neutral", "toxicity": 0-100}`
    });

    const parsed = JSON.parse(result);
    return {
      sentiment: parsed.sentiment || "neutral",
      toxicity: parsed.toxicity || 0
    };
  } catch (error) {
    return { sentiment: "neutral", toxicity: 0 };
  }
}

function calculateRiskLevel(categoryScores: Record<string, number>, toxicity: number): string {
  const maxScore = Math.max(...Object.values(categoryScores), toxicity);
  if (maxScore > 0.8) return "critical";
  if (maxScore > 0.6) return "high";
  if (maxScore > 0.4) return "medium";
  return "low";
}

function analyzeUploadPatterns(uploads: any[]): any {
  // Analyze upload frequency, timing, content patterns
  return {
    frequency: uploads.length,
    averageQuality: uploads.reduce((sum, u) => sum + (u.download_count || 0), 0) / uploads.length,
    timePattern: "regular"
  };
}

function calculateContentQuality(uploads: any[]): number {
  if (uploads.length === 0) return 0;
  const avgDownloads = uploads.reduce((sum, u) => sum + (u.download_count || 0), 0) / uploads.length;
  return Math.min(100, avgDownloads * 10);
}

function calculateEngagement(profile: any): number {
  // Calculate based on profile completeness, activity, etc.
  return 50; // Placeholder
}

// Content action functions
async function hideContent(contentId: string): Promise<void> {
  // Implementation to hide content
  console.log(`Hiding content: ${contentId}`);
}

async function removeContent(contentId: string): Promise<void> {
  // Implementation to remove content
  console.log(`Removing content: ${contentId}`);
}

async function warnUser(userId: string, reason: string): Promise<void> {
  // Implementation to warn user
  console.log(`Warning user ${userId}: ${reason}`);
}

async function restrictUser(userId: string, reason: string): Promise<void> {
  // Implementation to restrict user
  console.log(`Restricting user ${userId}: ${reason}`);
}

async function banUser(userId: string, reason: string): Promise<void> {
  // Implementation to ban user
  console.log(`Banning user ${userId}: ${reason}`);
}
