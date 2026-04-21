export const PLAN_LIMITS = {
  free: {
    analisis_por_mes: 5,
    alertas_max: 2,
    historial_meses: 12,
    consorcios: false,
    exportar: false,
  },
  pro: {
    analisis_por_mes: 50,
    alertas_max: 10,
    historial_meses: 60,
    consorcios: true,
    exportar: true,
  },
  business: {
    analisis_por_mes: 200,
    alertas_max: 50,
    historial_meses: 120,
    consorcios: true,
    exportar: true,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export async function checkAnalisisLimit(
  userId: string,
  plan: Plan,
  supabase: ReturnType<typeof import("@/lib/supabase/server").createClient> extends Promise<infer T> ? T : never
): Promise<{ allowed: boolean; current: number; max: number }> {
  const max = PLAN_LIMITS[plan].analisis_por_mes;
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("analisis_carteles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", inicioMes.toISOString());

  const current = count ?? 0;
  return { allowed: current < max, current, max };
}
