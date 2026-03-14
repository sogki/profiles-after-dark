import type { ModerationResult } from "../../../../lib/openai-moderation";

export interface ModCase {
  id: string;
  banType: "discord" | "website" | "";
  status: "open" | "resolved" | "denied";
}

export interface Appeal {
  id: string;
  appeal_reason: string;
  banType: "discord" | "website" | "";
  discordTag?: string;
  email?: string;
  username?: string;
  explanation: string;
  status: "pending" | "approved" | "denied";
  appeal_date: string;
  reviewed_by?: string;
  resolved_at?: string;
  mod_cases?: ModCase | null;
  reviewer_name?: string;
}

export interface ReportedUser {
  id: string;
  reason: string;
  description?: string;
  created_at: string;
  status?: string;
  reported_user_id?: string;
  reporter_user_id: string;
  content_id?: string;
  content_type?: string;
  reported_user: { username: string; avatar_url?: string; id?: string } | null;
  reporter_user: { username: string } | null;
}

export interface Log {
  id: string;
  moderator_id: string;
  action: string;
  target_user_id: string;
  target_profile_id: string | null;
  description: string | null;
  created_at: string;
  title?: string;
  tags?: string[];
  content_url?: string;
}

export interface UserSummary {
  user_id: string;
  display_name: string | null;
  username: string | null;
}

export interface ContentItem {
  id: string;
  title: string;
  image_url: string;
  category: string;
  type: "profile" | "banner";
  tags: string[];
  created_at: string;
  user_id?: string;
  username?: string;
  download_count?: number;
  source_table: "profiles" | "profile_pairs" | "emoji_combos";
}

export interface EditContentModal {
  open: boolean;
  content: ContentItem | null;
  editedTitle: string;
  editedTags: string[];
  tagInput: string;
}

export interface TrendingItem {
  id: string;
  title: string;
  type: "profile" | "pfp" | "banner" | "pair";
  image_url?: string;
  pfp_url?: string;
  banner_url?: string;
  download_count: number;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  trend_score: number;
  growth_rate: number;
}

export interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalContent: number;
    totalDownloads: number;
    totalReports: number;
    newUsersThisWeek: number;
    newContentThisWeek: number;
    reportsThisWeek: number;
    avgResponseTime: number;
  };
  contentStats: {
    profileCount: number;
    bannerCount: number;
    pairCount: number;
    categoriesBreakdown: Array<{ category: string; count: number }>;
    uploadTrends: Array<{ date: string; count: number }>;
    topTags: Array<{ tag: string; count: number }>;
    trendingItems: TrendingItem[];
  };
  userStats: {
    registrationTrends: Array<{ date: string; count: number }>;
    activeUsers: number;
    topUploaders: Array<{
      username: string;
      uploadCount: number;
      downloadCount: number;
    }>;
  };
  moderationStats: {
    reportsResolved: number;
    reportsPending: number;
    actionsThisMonth: number;
    topReportReasons: Array<{ reason: string; count: number }>;
    moderatorActivity: Array<{ moderator: string; actions: number }>;
  };
}

export interface UserAccount {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  last_active: string;
  role: "user" | "staff" | "admin";
  status: "active" | "restricted" | "terminated";
  upload_count: number;
  download_count: number;
}

export interface SystemSetting {
  id?: string;
  key: string;
  value: string;
  description: string;
  type: "boolean" | "string" | "number" | "json";
  category: string;
  created_at?: string;
  updated_at?: string;
}

export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  type: "content_filter" | "spam_detection" | "user_behavior" | "keyword_filter" | "ai_moderation";
  enabled: boolean;
  severity: "low" | "medium" | "high" | "critical";
  action: "flag" | "hide" | "remove" | "warn_user" | "restrict_user" | "ban_user";
  conditions: {
    keywords?: string[];
    patterns?: string[];
    thresholds?: Record<string, number>;
    categories?: string[];
    aiEnabled?: boolean;
    confidenceThreshold?: number;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface AutoModerationScan {
  id: string;
  content_id: string;
  content_type: "profile" | "banner" | "comment" | "message";
  scan_type: "ai_content" | "spam_detection" | "keyword_filter" | "image_analysis" | "openai_moderation";
  status: "pending" | "completed" | "failed";
  confidence_score: number;
  flags: string[];
  action_taken: string | null;
  rule_id?: string;
  ai_result?: ModerationResult;
  created_at: string;
  completed_at: string | null;
}

export interface SpamPattern {
  id: string;
  pattern: string;
  type: "regex" | "keyword" | "domain" | "behavior";
  description: string;
  severity: number;
  enabled: boolean;
  created_at: string;
  updated_at?: string;
}

export const MODERATION_GUILD_ID = "1386840977188061194";

