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
      auto_moderation_scans: {
        Row: {
          action_taken: string | null
          completed_at: string | null
          confidence_score: number | null
          content_id: string
          content_type: string
          created_at: string | null
          flags: string[] | null
          id: string
          rule_id: string | null
          scan_type: string
          status: string
        }
        Insert: {
          action_taken?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          flags?: string[] | null
          id?: string
          rule_id?: string | null
          scan_type: string
          status?: string
        }
        Update: {
          action_taken?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          flags?: string[] | null
          id?: string
          rule_id?: string | null
          scan_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_moderation_scans_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "moderation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
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
          id: string
          profile_id: string | null
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          emoji_combo_id?: string | null
          id?: string
          profile_id?: string | null
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          emoji_combo_id?: string | null
          id?: string
          profile_id?: string | null
          user_id?: string
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
            foreignKeyName: "favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_type: string
          automated: boolean | null
          created_at: string | null
          id: string
          reason: string | null
          rule_id: string | null
          scan_id: string | null
          target_content_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          automated?: boolean | null
          created_at?: string | null
          id?: string
          reason?: string | null
          rule_id?: string | null
          scan_id?: string | null
          target_content_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          automated?: boolean | null
          created_at?: string | null
          id?: string
          reason?: string | null
          rule_id?: string | null
          scan_id?: string | null
          target_content_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "moderation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "auto_moderation_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          moderator_id: string
          target_profile_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          moderator_id: string
          target_profile_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          moderator_id?: string
          target_profile_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      moderation_rules: {
        Row: {
          action: string
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          enabled: boolean | null
          id: string
          name: string
          severity: string
          type: string
          updated_at: string | null
        }
        Insert: {
          action: string
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          severity: string
          type: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          severity?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          type?: string
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
      reports: {
        Row: {
          content_id: string | null
          content_type: string | null
          created_at: string | null
          description: string | null
          details: string | null
          evidence: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          notification_sent_at: string | null
          notified_user: boolean | null
          reason: string
          reported_user_id: string | null
          reporter_user_id: string
          status: string | null
          urgent: boolean | null
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          details?: string | null
          evidence?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          notification_sent_at?: string | null
          notified_user?: boolean | null
          reason: string
          reported_user_id?: string | null
          reporter_user_id: string
          status?: string | null
          urgent?: boolean | null
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          details?: string | null
          evidence?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          notification_sent_at?: string | null
          notified_user?: boolean | null
          reason?: string
          reported_user_id?: string | null
          reporter_user_id?: string
          status?: string | null
          urgent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      spam_patterns: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          pattern: string
          severity: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          pattern: string
          severity?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          pattern?: string
          severity?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: number
          key: string
          type: string
          updated_at: string | null
          value: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: number
          key: string
          type?: string
          updated_at?: string | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: number
          key?: string
          type?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          user_id: string
        }
        Update: {
          badge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_warnings: {
        Row: {
          created_at: string | null
          id: number
          message: string | null
          moderator_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          message?: string | null
          moderator_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: string | null
          moderator_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_stats: {
        Row: {
          followers_count: number
          following_count: number
          id: string
          likes_received: number
          posts_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          followers_count?: number
          following_count?: number
          id?: string
          likes_received?: number
          posts_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          followers_count?: number
          following_count?: number
          id?: string
          likes_received?: number
          posts_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_system_settings_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_user_account: {
        Args: { uid: string }
        Returns: undefined
      }
      is_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
