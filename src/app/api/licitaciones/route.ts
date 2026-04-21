import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") ?? "";
    const estado = searchParams.get("estado") ?? "";
    const institucion = searchParams.get("institucion") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("licitaciones")
      .select("*", { count: "exact" })
      .order("fecha_limite_oferta", { ascending: true })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.ilike("titulo", `%${q}%`);
    }
    if (estado) {
      query = query.eq("estado", estado as "activo" | "adjudicado" | "desierto" | "cancelado");
    }
    if (institucion) {
      query = query.ilike("institucion", `%${institucion}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      meta: {
        page,
        total: count ?? 0,
        hasMore: offset + limit < (count ?? 0),
      },
    });
  } catch (err) {
    console.error("[api/licitaciones GET]", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Error interno" } },
      { status: 500 }
    );
  }
}
