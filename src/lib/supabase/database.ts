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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
