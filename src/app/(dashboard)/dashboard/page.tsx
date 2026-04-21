import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { LicitacionesActivas } from "@/components/dashboard/LicitacionesActivas";
import { NotificacionesFeed } from "@/components/dashboard/NotificacionesFeed";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, Plus } from "lucide-react";
import type { UserProfile, LicitacionGuardada, Licitacion, Notificacion, LicitacionConGuardada } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, guardadasRes, analisisRes, notifRes, ganadosRes] =
    await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("licitaciones_guardadas")
        .select("*")
        .eq("user_id", user.id)
        .in("estado_usuario", ["seguimiento", "ofertando"])
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("analisis_carteles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte(
          "created_at",
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString()
        ),
      supabase
        .from("notificaciones")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("licitaciones_guardadas")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("estado_usuario", "ganada"),
    ]);

  const profile = profileRes.data as UserProfile | null;
  const plan = (profile?.plan ?? "free") as keyof typeof PLAN_LIMITS;
  const guardadasRaw = (guardadasRes.data ?? []) as LicitacionGuardada[];
  const analisisCount = analisisRes.count ?? 0;
  const notificaciones = (notifRes.data ?? []) as Notificacion[];
  const contratosGanados = ganadosRes.count ?? 0;

  // Fetch licitaciones for the saved items
  const licitacionIds = guardadasRaw.map((g) => g.licitacion_id);
  let licitaciones: Licitacion[] = [];
  if (licitacionIds.length > 0) {
    const { data: licsData } = await supabase
      .from("licitaciones")
      .select("*")
      .in("id", licitacionIds);
    licitaciones = (licsData ?? []) as Licitacion[];
  }

  const licitacionesMap = new Map(licitaciones.map((l) => [l.id, l]));

  const licitacionesConGuardada: LicitacionConGuardada[] = guardadasRaw
    .flatMap((g) => {
      const lic = licitacionesMap.get(g.licitacion_id);
      if (!lic) return [];
      return [{
        ...lic,
        licitaciones_guardadas: [
          { id: g.id, estado_usuario: g.estado_usuario, notas: g.notas },
        ],
      }];
    });

  const proximosVencer = licitacionesConGuardada.filter((l) => {
    if (!l.fecha_limite_oferta) return false;
    const dias =
      (new Date(l.fecha_limite_oferta).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24);
    return dias >= 0 && dias <= 7;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {profile?.nombre_contacto ?? "proveedor"} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Aquí tenés un resumen de tus licitaciones activas.
          </p>
        </div>
        <Link href="/analisis/nuevo">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Brain className="w-4 h-4" />
            Analizar cartel
          </Button>
        </Link>
      </div>

      <StatsCards
        stats={{
          licitacionesActivas: guardadasRaw.length,
          analisisEsteMs: analisisCount,
          analisisMax: PLAN_LIMITS[plan].analisis_por_mes,
          proximosVencer,
          contratosGanados,
        }}
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <LicitacionesActivas licitaciones={licitacionesConGuardada} />
        </div>
        <div>
          <NotificacionesFeed notificaciones={notificaciones} />
        </div>
      </div>

      {plan === "free" && analisisCount >= 3 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <h3 className="font-bold text-lg mb-1">
            Estás cerca del límite del plan Free
          </h3>
          <p className="text-blue-100 text-sm mb-4">
            Usaste {analisisCount} de {PLAN_LIMITS.free.analisis_por_mes} análisis
            este mes. Upgradeá a Pro para 50 análisis/mes.
          </p>
          <Link href="/settings/plan">
            <Button variant="secondary" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Upgrade a Pro — $15/mes
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
