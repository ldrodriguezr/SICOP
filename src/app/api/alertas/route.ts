import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesión requerida" } },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("alertas_config")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[api/alertas GET]", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Error interno" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesión requerida" } },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const plan = profile?.plan ?? "free";
    const maxAlertas = plan === "free" ? 2 : plan === "pro" ? 10 : 50;

    const { count } = await supabase
      .from("alertas_config")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= maxAlertas) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PLAN_LIMIT",
            message: `Alcanzaste el límite de ${maxAlertas} alertas del plan ${plan}.`,
          },
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { nombre, palabras_clave, categorias, monto_min, monto_max, frecuencia } = body;

    if (!nombre) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Nombre requerido" } },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("alertas_config")
      .insert({
        user_id: user.id,
        nombre,
        palabras_clave: palabras_clave ?? [],
        categorias: categorias ?? [],
        monto_min: monto_min ?? null,
        monto_max: monto_max ?? null,
        frecuencia: frecuencia ?? "diario",
        activa: true,
        email_activo: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("[api/alertas POST]", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Error interno" } },
      { status: 500 }
    );
  }
}
