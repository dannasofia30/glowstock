export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nombre_completo: string;
          email: string;
          rol: 'admin' | 'usuario';
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nombre_completo?: string;
          email: string;
          rol?: 'admin' | 'usuario';
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nombre_completo?: string;
          email?: string;
          rol?: 'admin' | 'usuario';
          activo?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      restablecimientos_contrasena: {
        Row: {
          id: string;
          usuario_id: string;
          token_hash: string;
          expira_en: string;
          usado_en: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          token_hash: string;
          expira_en?: string;
          usado_en?: string | null;
          creado_en?: string;
        };
        Update: {
          usado_en?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'restablecimientos_contrasena_usuario_id_fkey';
            columns: ['usuario_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      contar_solicitudes_recuperacion: {
        Args: { p_usuario_id: string };
        Returns: number;
      };
      crear_token_recuperacion: {
        Args: { p_usuario_id: string; p_token_hash: string };
        Returns: string;
      };
      invalidar_tokens_recuperacion: {
        Args: { p_usuario_id: string };
        Returns: undefined;
      };
      consumir_token_recuperacion: {
        Args: { p_token_hash: string };
        Returns: { id: string; usuario_id: string }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
