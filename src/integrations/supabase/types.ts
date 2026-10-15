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
      books: {
        Row: {
          author: string | null
          category_id: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          edition: string | null
          id: string
          isbn: string | null
          lending_status: Database["public"]["Enums"]["lending_status"]
          owner_id: string
          publication_year: number | null
          publisher: string | null
          purchase_date: string | null
          purchase_value: number | null
          reading_status: Database["public"]["Enums"]["reading_status"]
          receipt_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          edition?: string | null
          id?: string
          isbn?: string | null
          lending_status?: Database["public"]["Enums"]["lending_status"]
          owner_id: string
          publication_year?: number | null
          publisher?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          reading_status?: Database["public"]["Enums"]["reading_status"]
          receipt_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          edition?: string | null
          id?: string
          isbn?: string | null
          lending_status?: Database["public"]["Enums"]["lending_status"]
          owner_id?: string
          publication_year?: number | null
          publisher?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          reading_status?: Database["public"]["Enums"]["reading_status"]
          receipt_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      borrow_records: {
        Row: {
          actual_return_date: string | null
          book_id: string
          borrower_email: string | null
          borrower_name: string
          borrower_organization: string | null
          borrower_phone: string | null
          cleared_at: string | null
          created_at: string
          date_borrowed: string
          expected_return_date: string | null
          id: string
          owner_id: string
          status: Database["public"]["Enums"]["borrow_status"]
          updated_at: string
        }
        Insert: {
          actual_return_date?: string | null
          book_id: string
          borrower_email?: string | null
          borrower_name: string
          borrower_organization?: string | null
          borrower_phone?: string | null
          cleared_at?: string | null
          created_at?: string
          date_borrowed?: string
          expected_return_date?: string | null
          id?: string
          owner_id: string
          status?: Database["public"]["Enums"]["borrow_status"]
          updated_at?: string
        }
        Update: {
          actual_return_date?: string | null
          book_id?: string
          cleared_at?: string | null
          borrower_email?: string | null
          borrower_name?: string
          borrower_organization?: string | null
          borrower_phone?: string | null
          created_at?: string
          date_borrowed?: string
          expected_return_date?: string | null
          id?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["borrow_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "borrow_records_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_group: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_group: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_group?: string
          sort_order?: number
        }
        Relationships: []
      }
      institution_requests: {
        Row: {
          approval_notified_at: string | null
          created_at: string
          id: string
          notified_at: string | null
          rejection_notified_at: string | null
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          approval_notified_at?: string | null
          created_at?: string
          id?: string
          notified_at?: string | null
          rejection_notified_at?: string | null
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          approval_notified_at?: string | null
          created_at?: string
          id?: string
          notified_at?: string | null
          rejection_notified_at?: string | null
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      lending_reminders: {
        Row: {
          audience: string
          borrow_record_id: string
          due_date: string
          id: string
          milestone: string
          sent_at: string
        }
        Insert: {
          audience: string
          borrow_record_id: string
          due_date: string
          id?: string
          milestone: string
          sent_at?: string
        }
        Update: {
          audience?: string
          borrow_record_id?: string
          due_date?: string
          id?: string
          milestone?: string
          sent_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          message: string
          read_at: string | null
          sent_at: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sent_at?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sent_at?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_email: string | null
          created_at: string
          email: string | null
          id: string
          last_exported_at: string | null
          suspended_at: string | null
          library_name: string | null
          name: string | null
          organization_name: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          position: string | null
          updated_at: string
        }
        Insert: {
          admin_email?: string | null
          created_at?: string
          email?: string | null
          id: string
          last_exported_at?: string | null
          suspended_at?: string | null
          library_name?: string | null
          name?: string | null
          organization_name?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          position?: string | null
          updated_at?: string
        }
        Update: {
          admin_email?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_exported_at?: string | null
          suspended_at?: string | null
          library_name?: string | null
          name?: string | null
          organization_name?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reading_goals: {
        Row: {
          created_at: string
          id: string
          period: Database["public"]["Enums"]["goal_period"]
          start_date: string
          target_unit: Database["public"]["Enums"]["goal_unit"]
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period: Database["public"]["Enums"]["goal_period"]
          start_date?: string
          target_unit: Database["public"]["Enums"]["goal_unit"]
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period?: Database["public"]["Enums"]["goal_period"]
          start_date?: string
          target_unit?: Database["public"]["Enums"]["goal_unit"]
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          book_id: string
          created_at: string
          current_page: number | null
          id: string
          key_lessons: string | null
          logged_at: string
          notes: string | null
          reading_time_minutes: number | null
          start_page: number | null
          total_pages: number | null
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          current_page?: number | null
          id?: string
          key_lessons?: string | null
          logged_at?: string
          notes?: string | null
          reading_time_minutes?: number | null
          start_page?: number | null
          total_pages?: number | null
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          current_page?: number | null
          id?: string
          key_lessons?: string | null
          logged_at?: string
          notes?: string | null
          reading_time_minutes?: number | null
          start_page?: number | null
          total_pages?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_streaks: {
        Row: {
          current_streak_days: number
          id: string
          last_logged_date: string | null
          longest_streak_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak_days?: number
          id?: string
          last_logged_date?: string | null
          longest_streak_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak_days?: number
          id?: string
          last_logged_date?: string | null
          longest_streak_days?: number
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_current_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      admin_recent_activity: {
        Args: { _limit?: number }
        Returns: {
          action: string
          actor_email: string
          created_at: string
          details: string | null
          target_organization: string | null
          target_user_id: string | null
        }[]
      }
      admin_school_detail: {
        Args: { _user_id: string }
        Returns: Json
      }
      admin_list_users: {
        Args: { _search?: string; _limit?: number }
        Returns: {
          book_count: number
          created_at: string
          email: string
          last_sign_in_at: string | null
          name: string | null
          organization_name: string | null
          plan: string
          suspended_at: string | null
          user_id: string
        }[]
      }
      admin_set_user_suspended: {
        Args: { _user_id: string; _suspended: boolean }
        Returns: undefined
      }
      admin_approve_institution_request: {
        Args: { _user_id: string }
        Returns: undefined
      }
      admin_list_institution_requests: {
        Args: Record<PropertyKey, never>
        Returns: {
          account_email: string | null
          admin_email: string | null
          created_at: string
          library_name: string | null
          organization_name: string | null
          status: string
          user_id: string
        }[]
      }
      admin_reject_institution_request: {
        Args: { _user_id: string }
        Returns: undefined
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      approve_institution_request: {
        Args: { _user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_institution_request: {
        Args: { _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "minister" | "student" | "institution_admin"
      borrow_status: "borrowed" | "returned" | "overdue" | "lost"
      goal_period: "daily" | "weekly" | "monthly" | "quarterly" | "annual"
      goal_unit: "pages" | "books"
      lending_status: "available" | "borrowed" | "overdue" | "returned" | "lost"
      notification_channel: "email" | "sms" | "whatsapp" | "push"
      notification_type: "lending_reminder" | "overdue" | "habit_nudge"
      plan_type: "free" | "premium" | "institutional"
      reading_status: "unread" | "reading" | "completed"
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
      app_role: ["minister", "student", "institution_admin"],
      borrow_status: ["borrowed", "returned", "overdue", "lost"],
      goal_period: ["daily", "weekly", "monthly", "quarterly", "annual"],
      goal_unit: ["pages", "books"],
      lending_status: ["available", "borrowed", "overdue", "returned", "lost"],
      notification_channel: ["email", "sms", "whatsapp", "push"],
      notification_type: ["lending_reminder", "overdue", "habit_nudge"],
      plan_type: ["free", "premium", "institutional"],
      reading_status: ["unread", "reading", "completed"],
    },
  },
} as const
