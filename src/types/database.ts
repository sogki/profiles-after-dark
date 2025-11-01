export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          message: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          message: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          message?: string
        }
        Relationships: []
      }
      downloads: {
        Row: {
          downloaded_at: string | null
          id: string
          profile_id: string
          user_id: string | null
        }
        Insert: {
          downloaded_at?: string | null
          id?: string
          profile_id: string
          user_id?: string | null
        }
        Update: {
          downloaded_at?: string | null
          id?: string
          profile_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downloads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emotes: {
        Row: {
          id: string
          user_id: string
          title: string
          image_url: string
          category: string
          tags: string[] | null
          download_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          image_url: string
          category?: string
          tags?: string[] | null
          download_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          image_url?: string
          category?: string
          tags?: string[] | null
          download_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      emoji_combos: {
        Row: {
          combo_text: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          combo_text: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          combo_text?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          content_type: string | null
          created_at: string | null
          emoji_combo_id: string | null
          emote_id: string | null
          id: string
          profile_id: string | null
          user_id: string
          wallpaper_id: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          emoji_combo_id?: string | null
          emote_id?: string | null
          id?: string
          profile_id?: string | null
          user_id: string
          wallpaper_id?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          emoji_combo_id?: string | null
          emote_id?: string | null
          id?: string
          profile_id?: string | null
          user_id?: string
          wallpaper_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_emoji_combo_id_fkey"
            columns: ["emoji_combo_id"]
            isOneToOne: false
            referencedRelation: "emoji_combos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_emote_id_fkey"
            columns: ["emote_id"]
            isOneToOne: false
            referencedRelation: "emotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_wallpaper_id_fkey"
            columns: ["wallpaper_id"]
            isOneToOne: false
            referencedRelation: "wallpapers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          category: string
          created_at: string | null
          download_count: number | null
          id: string
          image_url: string
          tags: string[] | null
          text_data: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          download_count?: number | null
          id?: string
          image_url: string
          tags?: string[] | null
          text_data?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          download_count?: number | null
          id?: string
          image_url?: string
          tags?: string[] | null
          text_data?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_pairs: {
        Row: {
          banner_url: string | null
          category: string | null
          created_at: string | null
          id: string
          pfp_url: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          banner_url?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          pfp_url?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          banner_url?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          pfp_url?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_active: boolean
          restricted_until: string | null
          role: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          restricted_until?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          restricted_until?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      wallpapers: {
        Row: {
          id: string
          user_id: string
          title: string
          image_url: string
          category: string
          resolution: string | null
          tags: string[] | null
          download_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          image_url: string
          category?: string
          resolution?: string | null
          tags?: string[] | null
          download_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          image_url?: string
          category?: string
          resolution?: string | null
          tags?: string[] | null
          download_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

