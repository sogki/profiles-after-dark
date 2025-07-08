export type ProfilePair = {
  id: string;
  user_id?: string;
  title: string;
  category?: string;
  tags?: string[];
  pfp_url: string;
  banner_url: string;
  download_count?: number;
  created_at?: string;
  updated_at?: string;
  color?: string;
};
