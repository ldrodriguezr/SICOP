export type { Database } from "./database";
export type { AnalisisResultado, Requisito, Recomendacion } from "./analysis";

import type { Database } from "./database";

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type Licitacion = Database["public"]["Tables"]["licitaciones"]["Row"];
export type AnalisisCartel = Database["public"]["Tables"]["analisis_carteles"]["Row"];
export type LicitacionGuardada = Database["public"]["Tables"]["licitaciones_guardadas"]["Row"];
export type AlertaConfig = Database["public"]["Tables"]["alertas_config"]["Row"];
export type ConsorcioProfile = Database["public"]["Tables"]["consorcio_perfiles"]["Row"];
export type ConsorcioSolicitud = Database["public"]["Tables"]["consorcio_solicitudes"]["Row"];
export type ConsorcioMensaje = Database["public"]["Tables"]["consorcio_mensajes"]["Row"];
export type Notificacion = Database["public"]["Tables"]["notificaciones"]["Row"];
export type HistorialPrecio = Database["public"]["Tables"]["historial_precios"]["Row"];

export type LicitacionConGuardada = Licitacion & {
  licitaciones_guardadas?: Array<{
    id: string;
    estado_usuario: LicitacionGuardada["estado_usuario"];
    notas: string | null;
  }>;
};

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
