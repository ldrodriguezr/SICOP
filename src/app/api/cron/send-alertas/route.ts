import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAlertaEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createAdminClient();
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: nuevas } = await supabase
      .from("licitaciones")
      .select("*")
      .gte("created_at", ayer);

    if (!nuevas?.length) {
      return NextResponse.json({
        success: true,
        data: { processed: 0, message: "No hay licitaciones nuevas" },
      });
    }

    const { data: alertas } = await supabase
      .from("alertas_config")
      .select("*, user_profiles(nombre_contacto)")
      .eq("activa", true)
      .eq("email_activo", true);

    if (!alertas?.length) {
      return NextResponse.json({
        success: true,
        data: { processed: 0, message: "No hay alertas activas" },
      });
    }

    const { data: users } = await supabase.auth.admin.listUsers();
    const emailMap = new Map(users?.users.map((u) => [u.id, u.email]) ?? []);

    let processed = 0;

    for (const alerta of alertas) {
      const matches = nuevas.filter((l) => {
        const titulo = l.titulo?.toLowerCase() ?? "";
        const keywordMatch =
          (alerta.palabras_clave as string[] | null)?.some((kw: string) =>
            titulo.includes(kw.toLowerCase())
          ) ?? false;

        const montoOk =
          (!alerta.monto_min || (l.monto_estimado ?? 0) >= alerta.monto_min) &&
          (!alerta.monto_max || (l.monto_estimado ?? 0) <= alerta.monto_max);

        return keywordMatch && montoOk;
      });

      if (matches.length > 0) {
        const email = emailMap.get(alerta.user_id);
        const profile = alerta.user_profiles as unknown as { nombre_contacto: string } | null;

        if (email) {
          await sendAlertaEmail({
            to: email,
            nombre: profile?.nombre_contacto ?? "proveedor",
            nombreAlerta: alerta.nombre,
            licitaciones: matches.map((l) => ({
              titulo: l.titulo,
              institucion: l.institucion,
              fecha_limite: l.fecha_limite_oferta
                ? formatDate(l.fecha_limite_oferta)
                : "N/D",
              url_sicop: l.url_sicop,
            })),
          });
          processed++;
        }

        await supabase.from("notificaciones").insert({
          user_id: alerta.user_id,
          tipo: "alerta_email",
          titulo: `${matches.length} licitación(es) nueva(s) — ${alerta.nombre}`,
          mensaje: matches.map((m) => m.titulo).join(", "),
          data: { alerta_id: alerta.id, count: matches.length },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { processed, total_nuevas: nuevas.length, total_alertas: alertas.length },
    });
  } catch (err) {
    console.error("[cron/send-alertas]", err);
    return NextResponse.json(
      { success: false, error: "Error enviando alertas" },
      { status: 500 }
    );
  }
}
