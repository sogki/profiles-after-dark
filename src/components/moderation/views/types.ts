export type SupportTicket = {
  id: string;
  user_id: string | null;
  type: "support";
  subject: string | null;
  message: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "urgent";
  ticket_number: string | null;
  assigned_to: string | null;
  owner_id: string | null;
  is_locked: boolean;
  locked_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  response: string | null;
  user_agent: string | null;
  platform: string | null;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    username: string | null;
    display_name: string | null;
  } | null;
  owner_profile?: {
    username: string | null;
    display_name: string | null;
  } | null;
};

export type ConversationMessage = {
  id: string;
  ticket_id: string;
  user_id: string | null;
  message: string;
  is_staff: boolean;
  created_at: string;
  user_profiles?: {
    username: string | null;
    display_name: string | null;
  } | null;
};

export interface ActivityLog {
  id: string;
  type: "moderation" | "upload" | "user" | "report" | "download" | "favorite" | "feedback" | "account" | "backup" | "deletion";
  action: string;
  description: string;
  user_id?: string;
  target_user_id?: string;
  user?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  target_user?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  created_at: string;
  metadata?: any;
}

export type ContentType = "profiles" | "profile_pairs" | "emotes" | "wallpapers" | "emoji_combos";

export interface ContentItem {
  id: string;
  user_id: string;
  title?: string;
  name?: string;
  type?: "profile" | "banner";
  image_url?: string | null;
  pfp_url?: string | null;
  banner_url?: string | null;
  combo_text?: string;
  description?: string;
  category: string;
  download_count?: number;
  tags: string[] | null;
  created_at: string;
  status: "approved" | "pending" | "rejected";
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  contentType: ContentType;
  user?: {
    username: string | null;
    display_name: string | null;
  };
}

