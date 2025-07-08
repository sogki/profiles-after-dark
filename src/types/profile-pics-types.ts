export type Profile = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  type: string;
  image_url: string;
  download_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  color?: string;
};
