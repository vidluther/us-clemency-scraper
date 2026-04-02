export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  pardonned: {
    Tables: {
      clemency_statistics: {
        Row: {
          commutations_granted: number | null;
          created_at: string | null;
          fiscal_year: number;
          id: string;
          pardons_granted: number | null;
          petitions_closed: number | null;
          petitions_denied: number | null;
          petitions_received: number | null;
          presidential_term_id: string;
          source_url: string;
          total_granted: number | null;
          updated_at: string | null;
        };
        Insert: {
          commutations_granted?: number | null;
          created_at?: string | null;
          fiscal_year: number;
          id?: string;
          pardons_granted?: number | null;
          petitions_closed?: number | null;
          petitions_denied?: number | null;
          petitions_received?: number | null;
          presidential_term_id: string;
          source_url?: string;
          total_granted?: number | null;
          updated_at?: string | null;
        };
        Update: {
          commutations_granted?: number | null;
          created_at?: string | null;
          fiscal_year?: number;
          id?: string;
          pardons_granted?: number | null;
          petitions_closed?: number | null;
          petitions_denied?: number | null;
          petitions_received?: number | null;
          presidential_term_id?: string;
          source_url?: string;
          total_granted?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clemency_statistics_presidential_term_id_fkey";
            columns: ["presidential_term_id"];
            isOneToOne: false;
            referencedRelation: "pardon_detail";
            referencedColumns: ["presidential_term_id"];
          },
          {
            foreignKeyName: "clemency_statistics_presidential_term_id_fkey";
            columns: ["presidential_term_id"];
            isOneToOne: false;
            referencedRelation: "presidential_term";
            referencedColumns: ["id"];
          },
        ];
      };
      pardon: {
        Row: {
          clemency_type: string;
          created_at: string | null;
          district: string | null;
          grant_date: string;
          id: string;
          offense: string;
          presidential_term_id: string;
          recipient_id: string;
          source_url: string | null;
          updated_at: string | null;
          warrant_url: string | null;
        };
        Insert: {
          clemency_type: string;
          created_at?: string | null;
          district?: string | null;
          grant_date: string;
          id?: string;
          offense: string;
          presidential_term_id: string;
          recipient_id: string;
          source_url?: string | null;
          updated_at?: string | null;
          warrant_url?: string | null;
        };
        Update: {
          clemency_type?: string;
          created_at?: string | null;
          district?: string | null;
          grant_date?: string;
          id?: string;
          offense?: string;
          presidential_term_id?: string;
          recipient_id?: string;
          source_url?: string | null;
          updated_at?: string | null;
          warrant_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pardon_presidential_term_id_fkey";
            columns: ["presidential_term_id"];
            isOneToOne: false;
            referencedRelation: "pardon_detail";
            referencedColumns: ["presidential_term_id"];
          },
          {
            foreignKeyName: "pardon_presidential_term_id_fkey";
            columns: ["presidential_term_id"];
            isOneToOne: false;
            referencedRelation: "presidential_term";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pardon_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "pardon_detail";
            referencedColumns: ["recipient_id"];
          },
          {
            foreignKeyName: "pardon_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "pardon_with_sentence";
            referencedColumns: ["recipient_id"];
          },
          {
            foreignKeyName: "pardon_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "recipient";
            referencedColumns: ["id"];
          },
        ];
      };
      presidential_term: {
        Row: {
          created_at: string | null;
          end_date: string | null;
          id: string;
          president_name: string;
          slug: string;
          start_date: string;
          term_number: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          president_name: string;
          slug: string;
          start_date: string;
          term_number: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          president_name?: string;
          slug?: string;
          start_date?: string;
          term_number?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      recipient: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sentence: {
        Row: {
          created_at: string | null;
          fine: number | null;
          id: string;
          original_sentence: string | null;
          pardon_id: string;
          recipient_id: string;
          restitution: number | null;
          sentence_in_months: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          fine?: number | null;
          id?: string;
          original_sentence?: string | null;
          pardon_id: string;
          recipient_id: string;
          restitution?: number | null;
          sentence_in_months?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          fine?: number | null;
          id?: string;
          original_sentence?: string | null;
          pardon_id?: string;
          recipient_id?: string;
          restitution?: number | null;
          sentence_in_months?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sentence_pardon_id_fkey";
            columns: ["pardon_id"];
            isOneToOne: false;
            referencedRelation: "pardon";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sentence_pardon_id_fkey";
            columns: ["pardon_id"];
            isOneToOne: false;
            referencedRelation: "pardon_detail";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sentence_pardon_id_fkey";
            columns: ["pardon_id"];
            isOneToOne: false;
            referencedRelation: "pardon_with_sentence";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sentence_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "pardon_detail";
            referencedColumns: ["recipient_id"];
          },
          {
            foreignKeyName: "sentence_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "pardon_with_sentence";
            referencedColumns: ["recipient_id"];
          },
          {
            foreignKeyName: "sentence_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "recipient";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      pardon_detail: {
        Row: {
          clemency_type: string | null;
          district: string | null;
          grant_date: string | null;
          id: string | null;
          offense: string | null;
          president_name: string | null;
          presidential_term_id: string | null;
          presidential_term_slug: string | null;
          recipient_id: string | null;
          recipient_name: string | null;
          source_url: string | null;
          term_number: number | null;
          warrant_url: string | null;
        };
        Relationships: [];
      };
      pardon_with_sentence: {
        Row: {
          clemency_type: string | null;
          district: string | null;
          fine: number | null;
          grant_date: string | null;
          id: string | null;
          offense: string | null;
          original_sentence: string | null;
          president_name: string | null;
          presidential_term_slug: string | null;
          recipient_id: string | null;
          recipient_name: string | null;
          restitution: number | null;
          sentence_in_months: number | null;
          source_url: string | null;
          term_number: number | null;
          warrant_url: string | null;
        };
        Relationships: [];
      };
      statistics_by_term: {
        Row: {
          commutations_granted: number | null;
          fiscal_year: number | null;
          id: string | null;
          pardons_granted: number | null;
          petitions_closed: number | null;
          petitions_denied: number | null;
          petitions_received: number | null;
          president_name: string | null;
          presidential_term_slug: string | null;
          source_url: string | null;
          term_end_date: string | null;
          term_number: number | null;
          term_start_date: string | null;
          total_granted: number | null;
        };
        Relationships: [];
      };
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

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  pardonned: {
    Enums: {},
  },
} as const;
