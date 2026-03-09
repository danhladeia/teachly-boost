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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      documentos_salvos: {
        Row: {
          conteudo: Json
          created_at: string
          disciplina: string | null
          id: string
          modelo: string | null
          nivel: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo?: Json
          created_at?: string
          disciplina?: string | null
          id?: string
          modelo?: string | null
          nivel?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo?: Json
          created_at?: string
          disciplina?: string | null
          id?: string
          modelo?: string | null
          nivel?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habilidades_bncc: {
        Row: {
          ano: string
          codigo: string
          created_at: string
          descricao: string
          disciplina: string
          id: string
          nivel: string
          objeto_conhecimento: string | null
          unidade_tematica: string | null
        }
        Insert: {
          ano: string
          codigo: string
          created_at?: string
          descricao: string
          disciplina: string
          id?: string
          nivel: string
          objeto_conhecimento?: string | null
          unidade_tematica?: string | null
        }
        Update: {
          ano?: string
          codigo?: string
          created_at?: string
          descricao?: string
          disciplina?: string
          id?: string
          nivel?: string
          objeto_conhecimento?: string | null
          unidade_tematica?: string | null
        }
        Relationships: []
      }
      notas_professor: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo?: string
          created_at?: string
          id?: string
          titulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          creditos_correcao: number
          creditos_ia: number
          credits_remaining: number
          email: string | null
          escola: string | null
          id: string
          logo_url: string | null
          logos_limit: number
          nome: string | null
          plan_type: string
          plano: string
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creditos_correcao?: number
          creditos_ia?: number
          credits_remaining?: number
          email?: string | null
          escola?: string | null
          id?: string
          logo_url?: string | null
          logos_limit?: number
          nome?: string | null
          plan_type?: string
          plano?: string
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creditos_correcao?: number
          creditos_ia?: number
          credits_remaining?: number
          email?: string | null
          escola?: string | null
          id?: string
          logo_url?: string | null
          logos_limit?: number
          nome?: string | null
          plan_type?: string
          plano?: string
          subscription_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provas: {
        Row: {
          config_tempo: number | null
          created_at: string
          escola: string | null
          id: string
          nivel: string | null
          professor: string | null
          serie: string | null
          status: string | null
          temas: string | null
          tipo_questoes: string | null
          tipo_tempo: string | null
          titulo: string
          turma: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          config_tempo?: number | null
          created_at?: string
          escola?: string | null
          id?: string
          nivel?: string | null
          professor?: string | null
          serie?: string | null
          status?: string | null
          temas?: string | null
          tipo_questoes?: string | null
          tipo_tempo?: string | null
          titulo?: string
          turma?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          config_tempo?: number | null
          created_at?: string
          escola?: string | null
          id?: string
          nivel?: string | null
          professor?: string | null
          serie?: string | null
          status?: string | null
          temas?: string | null
          tipo_questoes?: string | null
          tipo_tempo?: string | null
          titulo?: string
          turma?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questoes: {
        Row: {
          alternativas: Json | null
          conteudo: string
          created_at: string
          id: string
          imagem_url: string | null
          linhas: number | null
          ordem: number
          pontos: number
          prova_id: string
          resposta_correta: number | null
          tipo: string
        }
        Insert: {
          alternativas?: Json | null
          conteudo?: string
          created_at?: string
          id?: string
          imagem_url?: string | null
          linhas?: number | null
          ordem?: number
          pontos?: number
          prova_id: string
          resposta_correta?: number | null
          tipo?: string
        }
        Update: {
          alternativas?: Json | null
          conteudo?: string
          created_at?: string
          id?: string
          imagem_url?: string | null
          linhas?: number | null
          ordem?: number
          pontos?: number
          prova_id?: string
          resposta_correta?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_prova_id_fkey"
            columns: ["prova_id"]
            isOneToOne: false
            referencedRelation: "provas"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas_alunos: {
        Row: {
          created_at: string
          id: string
          imagem_gabarito_url: string | null
          nome_aluno: string
          nota: number | null
          prova_id: string
          respostas_json: Json | null
          tempo_gasto: number | null
          versao_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          imagem_gabarito_url?: string | null
          nome_aluno: string
          nota?: number | null
          prova_id: string
          respostas_json?: Json | null
          tempo_gasto?: number | null
          versao_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          imagem_gabarito_url?: string | null
          nome_aluno?: string
          nota?: number | null
          prova_id?: string
          respostas_json?: Json | null
          tempo_gasto?: number | null
          versao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "respostas_alunos_prova_id_fkey"
            columns: ["prova_id"]
            isOneToOne: false
            referencedRelation: "provas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_alunos_versao_id_fkey"
            columns: ["versao_id"]
            isOneToOne: false
            referencedRelation: "versoes_prova"
            referencedColumns: ["id"]
          },
        ]
      }
      support_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          sender_id: string
          sender_type?: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_email: string | null
          user_id: string
          user_name: string | null
          user_plan: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
          user_plan?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
          user_plan?: string | null
        }
        Relationships: []
      }
      timbres: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          nome_escola: string
          show_aluno: boolean
          show_data: boolean
          show_disciplina: boolean
          show_nome_escola: boolean | null
          show_professor: boolean
          show_serie: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          nome_escola?: string
          show_aluno?: boolean
          show_data?: boolean
          show_disciplina?: boolean
          show_nome_escola?: boolean | null
          show_professor?: boolean
          show_serie?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          nome_escola?: string
          show_aluno?: boolean
          show_data?: boolean
          show_disciplina?: boolean
          show_nome_escola?: boolean | null
          show_professor?: boolean
          show_serie?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      versoes_prova: {
        Row: {
          created_at: string
          id: string
          mapa_questoes: Json
          prova_id: string
          qr_code_id: string
          versao_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          mapa_questoes?: Json
          prova_id: string
          qr_code_id?: string
          versao_label?: string
        }
        Update: {
          created_at?: string
          id?: string
          mapa_questoes?: Json
          prova_id?: string
          qr_code_id?: string
          versao_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "versoes_prova_prova_id_fkey"
            columns: ["prova_id"]
            isOneToOne: false
            referencedRelation: "provas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_own_profile: { Args: { profile_user_id: string }; Returns: boolean }
      is_prova_owner: { Args: { p_prova_id: string }; Returns: boolean }
      is_support_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
