export interface GalleryUserProfile {
  user_id?: string;
  username: string | null;
  display_name?: string | null;
  avatar_url: string | null;
}

export interface GalleryProfilePair {
  id: string;
  user_id?: string;
  title: string;
  category?: string;
  tags?: string[];
  pfp_url: string;
  banner_url: string;
  download_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
  color?: string;
  type?: "pair";
  user_profiles?: GalleryUserProfile;
}

export interface GalleryImageItem {
  id: string;
  user_id: string;
  title: string;
  category: string;
  type: string;
  image_url: string;
  download_count: number;
  tags: string[];
  created_at: string | null;
  updated_at: string | null;
  text_data?: string;
  color?: string;
  user_profiles?: GalleryUserProfile;
}

export interface GalleryEmote {
  id: string;
  title: string;
  image_url: string;
  category: string;
  tags: string[] | null;
  download_count: number | null;
  created_at: string | null;
  user_id: string;
  user_profiles?: GalleryUserProfile;
}

export interface GalleryWallpaper {
  id: string;
  title: string;
  image_url: string;
  category: string;
  resolution: string | null;
  tags: string[] | null;
  download_count: number | null;
  created_at: string | null;
  user_id: string;
  user_profiles?: GalleryUserProfile;
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
  user_id?: string;
  user_profiles?: GalleryUserProfile;
}

