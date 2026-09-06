export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      architect_actions: {
        Row: {
          action_type: string
          created_at: string
          description: string
          id: string
          payload: Json
          previous_state: Json | null
          reverted: boolean
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          id?: string
          payload?: Json
          previous_state?: Json | null
          reverted?: boolean
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          id?: string
          payload?: Json
          previous_state?: Json | null
          reverted?: boolean
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          body: string
          created_at: string
          excerpt: string
          id: string
          published: boolean
          published_at: string | null
          read_minutes: number
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          excerpt: string
          id?: string
          published?: boolean
          published_at?: string | null
          read_minutes?: number
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          excerpt?: string
          id?: string
          published?: boolean
          published_at?: string | null
          read_minutes?: number
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_approved: boolean
          is_official: boolean
          member_count: number
          name: string
          slug: string
          topic: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_approved?: boolean
          is_official?: boolean
          member_count?: number
          name: string
          slug: string
          topic?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_approved?: boolean
          is_official?: boolean
          member_count?: number
          name?: string
          slug?: string
          topic?: string
        }
        Relationships: []
      }
      community_channels: {
        Row: {
          community_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          name: string
          position: number
          slug: string
        }
        Insert: {
          community_id: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          name: string
          position?: number
          slug: string
        }
        Update: {
          community_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          name?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          body: string
          channel_id: string
          community_id: string
          created_at: string
          id: string
          is_hidden: boolean
          user_id: string
        }
        Insert: {
          body?: string
          channel_id: string
          community_id: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          user_id: string
        }
        Update: {
          body?: string
          channel_id?: string
          community_id?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          body: string
          community_id: string
          created_at: string
          id: string
          is_hidden: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          community_id: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          community_id?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_widgets: {
        Row: {
          appearance: Json
          config: Json
          created_at: string
          id: string
          position: number
          size: string
          updated_at: string
          user_id: string
          widget_type: string
        }
        Insert: {
          appearance?: Json
          config?: Json
          created_at?: string
          id?: string
          position?: number
          size?: string
          updated_at?: string
          user_id: string
          widget_type: string
        }
        Update: {
          appearance?: Json
          config?: Json
          created_at?: string
          id?: string
          position?: number
          size?: string
          updated_at?: string
          user_id?: string
          widget_type?: string
        }
        Relationships: []
      }
      email_communications: {
        Row: {
          body: string
          id: string
          list_name: string
          notes: string | null
          recipient_count: number
          sent_at: string
          sent_by: string | null
          subject: string
        }
        Insert: {
          body?: string
          id?: string
          list_name?: string
          notes?: string | null
          recipient_count?: number
          sent_at?: string
          sent_by?: string | null
          subject: string
        }
        Update: {
          body?: string
          id?: string
          list_name?: string
          notes?: string | null
          recipient_count?: number
          sent_at?: string
          sent_by?: string | null
          subject?: string
        }
        Relationships: []
      }
      finance_budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          monthly_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          monthly_limit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          monthly_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          title: string
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          title: string
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          title?: string
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flowgrid_waitlist: {
        Row: {
          agency_name: string
          created_at: string
          email: string
          id: string
        }
        Insert: {
          agency_name: string
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          agency_name?: string
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      goal_milestones: {
        Row: {
          at_progress: number
          created_at: string
          goal_id: string
          id: string
          name: string
          reached: boolean
          user_id: string
        }
        Insert: {
          at_progress: number
          created_at?: string
          goal_id: string
          id?: string
          name: string
          reached?: boolean
          user_id: string
        }
        Update: {
          at_progress?: number
          created_at?: string
          goal_id?: string
          id?: string
          name?: string
          reached?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          progress: number
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          progress?: number
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          progress?: number
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          completed_date: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_date: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          colour: string
          created_at: string
          description: string | null
          frequency: string
          icon: string
          id: string
          is_archived: boolean
          name: string
          user_id: string
        }
        Insert: {
          colour?: string
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string
          id?: string
          is_archived?: boolean
          name: string
          user_id: string
        }
        Update: {
          colour?: string
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string
          id?: string
          is_archived?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          journal_id: string
          mood: string | null
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          journal_id: string
          mood?: string | null
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          journal_id?: string
          mood?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journals"
            referencedColumns: ["id"]
          },
        ]
      }
      journals: {
        Row: {
          colour: string
          created_at: string
          icon: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          colour?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          colour?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      media_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          rating: number | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      overlays: {
        Row: {
          author: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          palette: Json
          plan_tier: string
          preview_swatches: Json
          shape: string
          slug: string
        }
        Insert: {
          author?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          palette?: Json
          plan_tier?: string
          preview_swatches?: Json
          shape?: string
          slug: string
        }
        Update: {
          author?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          palette?: Json
          plan_tier?: string
          preview_swatches?: Json
          shape?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          custom_palette: Json | null
          dash_density: string
          dash_show_greeting: boolean
          dash_show_squares: boolean
          email: string | null
          focus_mode: boolean
          full_name: string | null
          id: string
          nav_hidden_items: Json
          nav_position: string
          plan: string
          testing_plan: string | null
          theme_chosen: boolean
          theme_preference: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_palette?: Json | null
          dash_density?: string
          dash_show_greeting?: boolean
          dash_show_squares?: boolean
          email?: string | null
          focus_mode?: boolean
          full_name?: string | null
          id: string
          nav_hidden_items?: Json
          nav_position?: string
          plan?: string
          testing_plan?: string | null
          theme_chosen?: boolean
          theme_preference?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_palette?: Json | null
          dash_density?: string
          dash_show_greeting?: boolean
          dash_show_squares?: boolean
          email?: string | null
          focus_mode?: boolean
          full_name?: string | null
          id?: string
          nav_hidden_items?: Json
          nav_position?: string
          plan?: string
          testing_plan?: string | null
          theme_chosen?: boolean
          theme_preference?: string
          updated_at?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          name: string
          tasks: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          name: string
          tasks?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          name?: string
          tasks?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      square_properties: {
        Row: {
          created_at: string
          id: string
          options: Json
          property_name: string
          property_type: string
          square_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          options?: Json
          property_name: string
          property_type: string
          square_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          options?: Json
          property_name?: string
          property_type?: string
          square_name?: string
          user_id?: string
        }
        Relationships: []
      }
      square_property_values: {
        Row: {
          created_at: string
          id: string
          property_id: string
          record_id: string
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          record_id: string
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          record_id?: string
          user_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "square_property_values_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "square_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          category: string
          coming_soon: boolean
          created_at: string
          currency: string
          description: string
          external_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price_cents: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          coming_soon?: boolean
          created_at?: string
          currency?: string
          description: string
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_cents?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          coming_soon?: boolean
          created_at?: string
          currency?: string
          description?: string
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_cents?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_routine_generated: boolean
          priority: string
          routine_source: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_routine_generated?: boolean
          priority?: string
          routine_source?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_routine_generated?: boolean
          priority?: string
          routine_source?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_blocks: {
        Row: {
          category: string
          created_at: string
          end_time: string
          id: string
          rating: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          end_time: string
          id?: string
          rating?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          end_time?: string
          id?: string
          rating?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_day_ratings: {
        Row: {
          created_at: string
          day: string
          id: string
          rating: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          rating: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          rating?: string
          user_id?: string
        }
        Relationships: []
      }
      user_overlays: {
        Row: {
          acquired_at: string
          id: string
          is_applied: boolean
          overlay_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          is_applied?: boolean
          overlay_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          is_applied?: boolean
          overlay_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_square_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          square_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          square_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          square_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_square_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      workflow_rules: {
        Row: {
          action: string
          action_config: Json
          condition: Json
          created_at: string
          id: string
          is_enabled: boolean
          last_run_at: string | null
          name: string
          run_count: number
          source_square: string
          target_square: string
          trigger_event: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          action_config?: Json
          condition?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name: string
          run_count?: number
          source_square: string
          target_square: string
          trigger_event: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          action_config?: Json
          condition?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name?: string
          run_count?: number
          source_square?: string
          target_square?: string
          trigger_event?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
