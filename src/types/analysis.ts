export interface Requisito {
  descripcion: string;
  tipo: "habilitante" | "tecnico" | "financiero" | "legal";
  critico: boolean;
  nota_simplificada: string;
}

export interface AnalisisResultado {
  resumen_ejecutivo: string;
  objeto_contrato: string;
  monto_estimado: number | null;
  plazo_oferta_dias: number;
  requisitos: Requisito[];
  documentos_necesarios: string[];
  score_viabilidad: number;
  razon_score: string;
  banderas_rojas: string[];
  oportunidades: string[];
  recomendacion: "participar" | "evaluar_mas" | "no_participar";
}

export type Recomendacion = AnalisisResultado["recomendacion"];
