/**
 * SICOP Data Sync — Observatorio de Compra Pública
 *
 * El Observatorio ofrece datos abiertos en:
 * https://www.observatoriocomprapublica.go.cr/
 *
 * Formatos disponibles: CSV y Excel descargables por categoría.
 * Esta implementación usa el endpoint de datos abiertos que retorna JSON.
 * Si el endpoint cambia, actualizar OBSERVATORIO_API_URL.
 *
 * NOTA: Validar el formato real antes del primer deploy en producción.
 * Si la API no retorna JSON, adaptar al formato real (CSV/XLSX con papaparse/xlsx).
 */

import { createAdminClient } from "@/lib/supabase/server";

const OBSERVATORIO_API_URL =
  "https://www.observatoriocomprapublica.go.cr/api/v1/licitaciones";

interface RawLicitacion {
  numeroProcedimiento?: string;
  idProcedimiento?: string;
  descripcionProcedimiento?: string;
  nombreInstitucion?: string;
  fechaPublicacion?: string;
  fechaLimiteRecepcion?: string;
  presupuestoEstimado?: string | number;
  estadoProcedimiento?: string;
  tipoProcedimiento?: string;
  categorias?: string[];
  codigoCabie?: string;
}

function mapEstado(estado: string | undefined): string {
  const map: Record<string, string> = {
    activo: "activo",
    "en proceso": "activo",
    adjudicado: "adjudicado",
    adjudicada: "adjudicado",
    desierto: "desierto",
    cancelado: "cancelado",
    cancelada: "cancelado",
  };
  return map[estado?.toLowerCase() ?? ""] ?? "activo";
}

function transformLicitacion(raw: RawLicitacion) {
  return {
    numero_procedimiento:
      raw.numeroProcedimiento ?? raw.idProcedimiento ?? `unknown-${Date.now()}`,
    titulo: raw.descripcionProcedimiento ?? "Sin descripción",
    institucion: raw.nombreInstitucion ?? "Institución desconocida",
    fecha_publicacion: raw.fechaPublicacion ?? null,
    fecha_limite_oferta: raw.fechaLimiteRecepcion ?? null,
    monto_estimado: raw.presupuestoEstimado
      ? parseFloat(String(raw.presupuestoEstimado))
      : null,
    estado: mapEstado(raw.estadoProcedimiento),
    tipo: raw.tipoProcedimiento ?? null,
    url_sicop: raw.idProcedimiento
      ? `https://www.sicop.go.cr/moduloPcont/pcont/proc/CE_MantenimientoExpedientesView.jsp?idProceso=${raw.idProcedimiento}`
      : null,
    categorias: raw.categorias ?? [],
    codigo_cabie: raw.codigoCabie ?? null,
    raw_data: raw,
  };
}

export async function syncLicitaciones(): Promise<{
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const response = await fetch(OBSERVATORIO_API_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(
        `Error descargando datos SICOP: ${response.status} ${response.statusText}`
      );
    }

    const rawData: RawLicitacion[] = await response.json();

    if (!Array.isArray(rawData)) {
      throw new Error("El Observatorio no retornó un array de licitaciones");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const licitaciones = rawData.map(transformLicitacion) as any[];

    const supabase = await createAdminClient();

    const BATCH_SIZE = 100;
    for (let i = 0; i < licitaciones.length; i += BATCH_SIZE) {
      const batch = licitaciones.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("licitaciones")
        .upsert(batch, { onConflict: "numero_procedimiento" });

      if (error) {
        errors.push(`Batch ${i}-${i + BATCH_SIZE}: ${error.message}`);
      } else {
        synced += batch.length;
      }
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "Error desconocido");
  }

  return { synced, errors };
}

export async function procesarAlertas(
  licitacionesNuevas: ReturnType<typeof transformLicitacion>[]
) {
  const supabase = await createAdminClient();

  const { data: alertas } = await supabase
    .from("alertas_config")
    .select("*, user_profiles(nombre_contacto)")
    .eq("activa", true);

  if (!alertas?.length) return;

  for (const alerta of alertas) {
    const matches = licitacionesNuevas.filter((l) => {
      const titulo = l.titulo.toLowerCase();
      const keywordMatch =
        alerta.palabras_clave?.some((kw: string) =>
          titulo.includes(kw.toLowerCase())
        ) ?? false;
      const categoriaMatch =
        alerta.categorias?.some((c: string) =>
          l.categorias?.includes(c)
        ) ?? false;
      const institucionMatch =
        alerta.instituciones?.includes(l.institucion) ?? false;
      const montoMatch =
        (!alerta.monto_min || (l.monto_estimado ?? 0) >= alerta.monto_min) &&
        (!alerta.monto_max || (l.monto_estimado ?? 0) <= alerta.monto_max);

      return (keywordMatch || categoriaMatch || institucionMatch) && montoMatch;
    });

    if (matches.length > 0) {
      await supabase.from("notificaciones").insert({
        user_id: alerta.user_id,
        tipo: "alerta_licitacion",
        titulo: `${matches.length} licitación(es) nueva(s) — ${alerta.nombre}`,
        mensaje: matches.map((m) => m.titulo).join(", "),
        data: { alerta_id: alerta.id, licitaciones: matches.map((m) => m.numero_procedimiento) },
      });
    }
  }
}
