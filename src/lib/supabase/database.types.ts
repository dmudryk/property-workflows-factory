// Типи схеми бази. Оновлюйте разом із міграцією: готовий файл — у Summary прогону job db-check у CI
// (supabase gen types typescript --local на одноразовій базі); або npm run db:types після npx supabase link на ваш проєкт.
// Ця версія написана вручну й описує таблиці й функції з міграцій 20261012000000_profiles_and_roles.sql,
// 20261020123813_runs_launch.sql, 20261020124103_runs_complete_tasks.sql, 20261021071209_runs_clarifications.sql і
// 20261026175944_templates_versions.sql (template_sections і template_tasks прибрано — зміст шаблону у версіях).

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
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      templates: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          current_version: number | null;
          current_content: Json | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          current_version?: number | null;
          current_content?: Json | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          current_version?: number | null;
          current_content?: Json | null;
        };
        Relationships: [];
      };
      template_versions: {
        Row: {
          template_id: string;
          number: number;
          content: Json;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          template_id: string;
          number: number;
          content: Json;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          template_id?: string;
          number?: number;
          content?: Json;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "template_versions_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "template_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      template_drafts: {
        Row: {
          template_id: string;
          content: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          template_id: string;
          content: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          template_id?: string;
          content?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "template_drafts_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: true;
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
        ];
      };
      runs: {
        Row: {
          id: string;
          template_id: string;
          template_version: number;
          template_name: string;
          case_name: string;
          status: string;
          manager_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          template_version: number;
          template_name: string;
          case_name: string;
          status?: string;
          manager_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          template_version?: number;
          template_name?: string;
          case_name?: string;
          status?: string;
          manager_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "runs_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
        ];
      };
      run_tasks: {
        Row: {
          id: string;
          run_id: string;
          section_name: string;
          name: string;
          required: boolean;
          position: number;
          assignee_id: string;
          status: string;
          done_at: string | null;
          done_by: string | null;
        };
        Insert: {
          id?: string;
          run_id: string;
          section_name: string;
          name: string;
          required: boolean;
          position: number;
          assignee_id: string;
          status?: string;
          done_at?: string | null;
          done_by?: string | null;
        };
        Update: {
          id?: string;
          run_id?: string;
          section_name?: string;
          name?: string;
          required?: boolean;
          position?: number;
          assignee_id?: string;
          status?: string;
          done_at?: string | null;
          done_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "run_tasks_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      launch_run: {
        Args: { p_template_id: string; p_case_name: string; p_assignments?: Json };
        Returns: string;
      };
      mark_task_done: {
        Args: { p_task_id: string };
        Returns: undefined;
      };
      list_staff: {
        Args: Record<PropertyKey, never>;
        Returns: { id: string; email: string | null }[];
      };
      vendor_runs: {
        Args: { p_run_id?: string };
        Returns: { id: string; case_name: string; status: string; created_at: string }[];
      };
      vendor_tasks: {
        Args: { p_run_id?: string };
        Returns: {
          id: string;
          run_id: string;
          section_name: string;
          name: string;
          required: boolean;
          position: number;
          status: string;
        }[];
      };
      create_template: {
        Args: { p_name: string };
        Returns: string;
      };
      save_template_draft: {
        Args: { p_template_id: string; p_content: Json };
        Returns: undefined;
      };
      publish_template_version: {
        Args: { p_template_id: string };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
