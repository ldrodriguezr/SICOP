export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          nombre_empresa: string | null;
          cedula_juridica: string | null;
          nombre_contacto: string;
          telefono: string | null;
          zona_geografica: string | null;
          categorias_interes: string[] | null;
          plan: "free" | "pro" | "business";
          plan_expires_at: string | null;
          stripe_customer_id: string | null;
          registrado_sicop: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nombre_empresa?: string | null;
          cedula_juridica?: string | null;
          nombre_contacto: string;
          telefono?: string | null;
          zona_geografica?: string | null;
          categorias_interes?: string[] | null;
          plan?: "free" | "pro" | "business";
          plan_expires_at?: string | null;
          stripe_customer_id?: string | null;
          registrado_sicop?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
        Relationships: [];
      };
      licitaciones: {
        Row: {
          id: string;
          numero_procedimiento: string;
          tipo: string | null;
          titulo: string;
          descripcion: string | null;
          institucion: string;
          fecha_publicacion: string | null;
          fecha_limite_oferta: string | null;
          monto_estimado: number | null;
          moneda: string;
          estado: "activo" | "adjudicado" | "desierto" | "cancelado";
          url_sicop: string | null;
          url_cartel: string | null;
          categorias: string[] | null;
          codigo_cabie: string | null;
          ganador_cedula: string | null;
          ganador_nombre: string | null;
          monto_adjudicado: number | null;
          raw_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero_procedimiento: string;
          tipo?: string | null;
          titulo: string;
          descripcion?: string | null;
          institucion: string;
          fecha_publicacion?: string | null;
          fecha_limite_oferta?: string | null;
          monto_estimado?: number | null;
          moneda?: string;
          estado?: "activo" | "adjudicado" | "desierto" | "cancelado";
          url_sicop?: string | null;
          url_cartel?: string | null;
          categorias?: string[] | null;
          codigo_cabie?: string | null;
          ganador_cedula?: string | null;
          ganador_nombre?: string | null;
          monto_adjudicado?: number | null;
          raw_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["licitaciones"]["Insert"]>;
        Relationships: [];
      };
      analisis_carteles: {
        Row: {
          id: string;
          user_id: string;
          licitacion_id: string | null;
          texto_original: string | null;
          resumen: string;
          requisitos: Json | null;
          score_viabilidad: number | null;
          documentos_necesarios: string[] | null;
          observaciones_ia: string | null;
          tokens_usados: number | null;
          costo_usd: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          licitacion_id?: string | null;
          texto_original?: string | null;
          resumen: string;
          requisitos?: Json | null;
          score_viabilidad?: number | null;
          documentos_necesarios?: string[] | null;
          observaciones_ia?: string | null;
          tokens_usados?: number | null;
          costo_usd?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["analisis_carteles"]["Insert"]>;
        Relationships: [];
      };
      licitaciones_guardadas: {
        Row: {
          id: string;
          user_id: string;
          licitacion_id: string;
          estado_usuario: "seguimiento" | "ofertando" | "ganada" | "perdida" | "descartada";
          notas: string | null;
          documentos_pendientes: string[] | null;
          recordatorio_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          licitacion_id: string;
          estado_usuario?: "seguimiento" | "ofertando" | "ganada" | "perdida" | "descartada";
          notas?: string | null;
          documentos_pendientes?: string[] | null;
          recordatorio_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["licitaciones_guardadas"]["Insert"]>;
        Relationships: [];
      };
      alertas_config: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          palabras_clave: string[] | null;
          categorias: string[] | null;
          instituciones: string[] | null;
          monto_min: number | null;
          monto_max: number | null;
          activa: boolean;
          frecuencia: "inmediato" | "diario" | "semanal";
          email_activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          palabras_clave?: string[] | null;
          categorias?: string[] | null;
          instituciones?: string[] | null;
          monto_min?: number | null;
          monto_max?: number | null;
          activa?: boolean;
          frecuencia?: "inmediato" | "diario" | "semanal";
          email_activo?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["alertas_config"]["Insert"]>;
        Relationships: [];
      };
      consorcio_perfiles: {
        Row: {
          id: string;
          user_id: string;
          titulo: string;
          descripcion: string;
          productos_servicios: string[] | null;
          capacidad_mensual_usd: number | null;
          zona_cobertura: string[] | null;
          tiene_sicop: boolean;
          experiencia_licitaciones: number;
          rating: number;
          total_ratings: number;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          titulo: string;
          descripcion: string;
          productos_servicios?: string[] | null;
          capacidad_mensual_usd?: number | null;
          zona_cobertura?: string[] | null;
          tiene_sicop?: boolean;
          experiencia_licitaciones?: number;
          rating?: number;
          total_ratings?: number;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["consorcio_perfiles"]["Insert"]>;
        Relationships: [];
      };
      consorcio_solicitudes: {
        Row: {
          id: string;
          solicitante_id: string;
          receptor_id: string;
          licitacion_id: string | null;
          mensaje: string | null;
          estado: "pendiente" | "aceptada" | "rechazada" | "completada";
          created_at: string;
        };
        Insert: {
          id?: string;
          solicitante_id: string;
          receptor_id: string;
          licitacion_id?: string | null;
          mensaje?: string | null;
          estado?: "pendiente" | "aceptada" | "rechazada" | "completada";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["consorcio_solicitudes"]["Insert"]>;
        Relationships: [];
      };
      notificaciones: {
        Row: {
          id: string;
          user_id: string;
          tipo: string;
          titulo: string;
          mensaje: string | null;
          data: Json | null;
          leida: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tipo: string;
          titulo: string;
          mensaje?: string | null;
          data?: Json | null;
          leida?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notificaciones"]["Insert"]>;
        Relationships: [];
      };
      historial_precios: {
        Row: {
          id: string;
          codigo_cabie: string | null;
          descripcion_bien: string | null;
          institucion: string | null;
          monto_adjudicado: number | null;
          fecha_adjudicacion: string | null;
          proveedor_nombre: string | null;
          cantidad: number | null;
          unidad: string | null;
          precio_unitario: number | null;
          año: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          codigo_cabie?: string | null;
          descripcion_bien?: string | null;
          institucion?: string | null;
          monto_adjudicado?: number | null;
          fecha_adjudicacion?: string | null;
          proveedor_nombre?: string | null;
          cantidad?: number | null;
          unidad?: string | null;
          precio_unitario?: number | null;
          año?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["historial_precios"]["Insert"]>;
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
}
