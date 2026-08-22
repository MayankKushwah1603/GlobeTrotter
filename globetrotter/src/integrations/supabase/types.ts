export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          city_id: string;
          cost_usd: number;
          created_at: string;
          description: string;
          duration_minutes: number;
          id: string;
          image_url: string;
          title: string;
          type: string;
        };
        Insert: {
          city_id: string;
          cost_usd?: number;
          created_at?: string;
          description?: string;
          duration_minutes?: number;
          id?: string;
          image_url?: string;
          title: string;
          type?: string;
        };
        Update: {
          city_id?: string;
          cost_usd?: number;
          created_at?: string;
          description?: string;
          duration_minutes?: number;
          id?: string;
          image_url?: string;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      cities: {
        Row: {
          cost_index: number;
          country: string;
          created_at: string;
          description: string;
          id: string;
          image_url: string;
          name: string;
          popularity: number;
          region: string;
        };
        Insert: {
          cost_index?: number;
          country: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string;
          name: string;
          popularity?: number;
          region: string;
        };
        Update: {
          cost_index?: number;
          country?: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string;
          name?: string;
          popularity?: number;
          region?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          id: string;
          incurred_on: string | null;
          note: string;
          trip_id: string;
        };
        Insert: {
          amount?: number;
          category: string;
          created_at?: string;
          id?: string;
          incurred_on?: string | null;
          note?: string;
          trip_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          id?: string;
          incurred_on?: string | null;
          note?: string;
          trip_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          language: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id: string;
          language?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          language?: string;
        };
        Relationships: [];
      };
      saved_destinations: {
        Row: {
          city_id: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          city_id: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          city_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_destinations_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      share_links: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          trip_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          trip_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          trip_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "share_links_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: true;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_activities: {
        Row: {
          activity_id: string | null;
          category: string;
          cost_usd: number;
          created_at: string;
          day_date: string;
          description: string;
          duration_minutes: number;
          id: string;
          position: number;
          start_time: string | null;
          stop_id: string;
          title: string;
        };
        Insert: {
          activity_id?: string | null;
          category?: string;
          cost_usd?: number;
          created_at?: string;
          day_date: string;
          description?: string;
          duration_minutes?: number;
          id?: string;
          position?: number;
          start_time?: string | null;
          stop_id: string;
          title: string;
        };
        Update: {
          activity_id?: string | null;
          category?: string;
          cost_usd?: number;
          created_at?: string;
          day_date?: string;
          description?: string;
          duration_minutes?: number;
          id?: string;
          position?: number;
          start_time?: string | null;
          stop_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_activities_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_activities_stop_id_fkey";
            columns: ["stop_id"];
            isOneToOne: false;
            referencedRelation: "trip_stops";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_stops: {
        Row: {
          city_id: string;
          created_at: string;
          end_date: string;
          id: string;
          notes: string;
          position: number;
          start_date: string;
          trip_id: string;
        };
        Insert: {
          city_id: string;
          created_at?: string;
          end_date: string;
          id?: string;
          notes?: string;
          position?: number;
          start_date: string;
          trip_id: string;
        };
        Update: {
          city_id?: string;
          created_at?: string;
          end_date?: string;
          id?: string;
          notes?: string;
          position?: number;
          start_date?: string;
          trip_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_stops_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_stops_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      trips: {
        Row: {
          budget_limit: number | null;
          cover_image_url: string | null;
          created_at: string;
          description: string;
          end_date: string;
          id: string;
          name: string;
          start_date: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          budget_limit?: number | null;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string;
          end_date: string;
          id?: string;
          name: string;
          start_date: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          budget_limit?: number | null;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string;
          end_date?: string;
          id?: string;
          name?: string;
          start_date?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
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
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
