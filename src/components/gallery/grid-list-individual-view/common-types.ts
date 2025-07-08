import { Profile, ProfilePair } from "@/types";
import { User } from "@supabase/supabase-js";

export type LookupTables = ProfilePair | Profile;

export type GalleryItemPreview = {
  id: string;
  title: string;
  image_url: string;
  download_count: number;
  category?: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
  user?: User | null;
  type: string;
  favorites: Set<string>;
  pfp_url?: string;
  banner_url?: string;
};

export type GalleryItemProps<T extends LookupTables> = {
  item: GalleryItemPreview;
  rawData: T;
  handleFavorite: (id: string) => void;
  openPreview: (item: T) => void;
  handleDownloadBoth: (item: T) => void;
};

export type CombinedGridViewProps<T extends LookupTables> =
  GalleryItemProps<T> & {
    viewMode: "grid" | "list";
  };
