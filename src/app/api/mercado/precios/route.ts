import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") ?? "";
    const cabie = searchParams.get("cabie") ?? "";
    const años = parseInt(searchParams.get("años") ?? "5");

    const fechaDesde = new Date();
    fechaDesde.setFullYear(fechaDesde.getFullYear() - años);

    let query = supabase
      .from("historial_precios")
      .select("*")
      .gte("fecha_adjudicacion", fechaDesde.toISOString().split("T")[0])
      .order("fecha_adjudicacion", { ascending: false })
      .limit(200);

    if (q) {
      query = query.ilike("descripcion_bien", `%${q}%`);
    }
    if (cabie) {
      query = query.eq("codigo_cabie", cabie);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const precios = data
      .map((d) => d.precio_unitario)
      .filter((p): p is number => p !== null);

    const estadisticas = {
      promedio: precios.reduce((a, b) => a + b, 0) / precios.length,
      minimo: Math.min(...precios),
      maximo: Math.max(...precios),
      total_contratos: data.length,
    };

    const porAño = data.reduce<Record<number, number[]>>((acc, d) => {
      if (d.año && d.precio_unitario) {
        if (!acc[d.año]) acc[d.año] = [];
        acc[d.año].push(d.precio_unitario);
      }
      return acc;
    }, {});

    const tendencia = Object.entries(porAño)
      .map(([año, precios]) => ({
        año: parseInt(año),
        promedio: precios.reduce((a, b) => a + b, 0) / precios.length,
        contratos: precios.length,
      }))
      .sort((a, b) => a.año - b.año);

    return NextResponse.json({
      success: true,
      data: { registros: data.slice(0, 20), estadisticas, tendencia },
    });
  } catch (err) {
    console.error("[api/mercado/precios GET]", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Error interno" } },
      { status: 500 }
    );
  }
}
