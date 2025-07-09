export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: 'discord' | 'twitter' | 'instagram' | 'general';
          type: 'profile' | 'banner';
          image_url: string;
          download_count: number | null;
          tags: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category: 'discord' | 'twitter' | 'instagram' | 'general';
          type: 'profile' | 'banner';
          image_url: string;
          download_count?: number | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: 'discord' | 'twitter' | 'instagram' | 'general';
          type?: 'profile' | 'banner';
          image_url?: string;
          download_count?: number | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      downloads: {
        Row: {
          id: string;
          profile_id: string;
          user_id: string | null;
          downloaded_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          user_id?: string | null;
          downloaded_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          user_id?: string | null;
          downloaded_at?: string | null;
        };
      };

      favorites: {
        Row: {
          id: string;
          profile_id: string;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          user_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          user_id?: string;
          created_at?: string | null;
        };
      };

      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string | null;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      emoji_combos: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          tags: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      mod_cases: {
        Row: {
          id: number;
          guild_id: string;
          case_id: number;
          moderator_tag: string | null;
          user_tag: string | null;
          action: string;
          reason: string | null;
          timestamp: string;
        };
        Insert: {
          id?: number;
          guild_id: string;
          case_id: number;
          moderator_tag?: string | null;
          user_tag?: string | null;
          action: string;
          reason?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: number;
          guild_id?: string;
          case_id?: number;
          moderator_tag?: string | null;
          user_tag?: string | null;
          action?: string;
          reason?: string | null;
          timestamp?: string;
        };
      };
    };

      appeals: {
        Row: {
          id: string;
          reason: string;
          ban_type: 'discord' | 'website';
          discord_tag: string | null;
          email: string | null;
          username: string | null;
          explanation: string;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          reason: string;
          ban_type: 'discord' | 'website';
          discord_tag?: string | null;
          email?: string | null;
          username?: string | null;
          explanation: string;
          submitted_at?: string | null;
        };
        Update: {
          id?: string;
          reason?: string;
          ban_type?: 'discord' | 'website';
          discord_tag?: string | null;
          email?: string | null;
          username?: string | null;
          explanation?: string;
          submitted_at?: string | null;
        };
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      [_ in never]: never;
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  }