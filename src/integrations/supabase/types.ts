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
          created_at: string
          email: string | null
          id: string
          name: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
