export interface CommunityUser {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  created_at?: string;
  upload_count?: number;
  follower_count?: number;
  is_following?: boolean;
  spotlight_enabled?: boolean;
  spotlight_priority?: number;
}

export interface ActivityItem {
  id: string;
  type: "upload" | "follow" | "favorite" | "download" | "profile_pair" | "emoji_combo";
  user_id: string;
  username?: string;
  avatar_url?: string;
  content_title?: string;
  content_id?: string;
  content_type?: string;
  target_user_id?: string;
  target_username?: string;
  created_at: string;
  url?: string;
}

