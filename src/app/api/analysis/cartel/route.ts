import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient, CLAUDE_MODEL, SYSTEM_PROMPT_ANALISIS, calcularCostoAnalisis } from "@/lib/anthropic";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;
import type { AnalisisResultado } from "@/types/analysis";

const MAX_TEXTO_LENGTH = 50_000;

async function extraerTexto(tipo: string, contenido: string): Promise<string> {
  if (tipo === "texto") {
    return contenido.slice(0, MAX_TEXTO_LENGTH);
  }

  if (tipo === "pdf") {
    const buffer = Buffer.from(contenido, "base64");
    const parsed = await pdfParse(buffer);
    return parsed.text.slice(0, MAX_TEXTO_LENGTH);
  }

  if (tipo === "url") {
    const res = await fetch(contenido, {
      headers: { "User-Agent": "SICOPCopilot/1.0" },
    });
    if (!res.ok) throw new Error(`No se pudo acceder a la URL: ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("pdf")) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const parsed = await pdfParse(buffer);
      return parsed.text.slice(0, MAX_TEXTO_LENGTH);
    }

    const html = await res.text();
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_TEXTO_LENGTH);
  }

  throw new Error("Tipo de contenido no soportado");
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

    const plan = (profile?.plan ?? "free") as keyof typeof PLAN_LIMITS;
    const maxAnalisis = PLAN_LIMITS[plan].analisis_por_mes;

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { count: analisisCount } = await supabase
      .from("analisis_carteles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", inicioMes.toISOString());

    if ((analisisCount ?? 0) >= maxAnalisis) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PLAN_LIMIT",
            message: `Alcanzaste el límite de ${maxAnalisis} análisis del plan ${plan}. Upgradeá para continuar.`,
          },
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { tipo, contenido, licitacionId } = body;

    if (!tipo || !contenido) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Tipo y contenido requeridos" } },
        { status: 400 }
      );
    }

    const textoCartel = await extraerTexto(tipo, contenido);

    if (textoCartel.trim().length < 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_TEXT",
            message: "No se pudo extraer suficiente texto del cartel. Si es un PDF escaneado, intentá pegar el texto manualmente.",
          },
        },
        { status: 422 }
      );
    }

    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT_ANALISIS,
      messages: [
        {
          role: "user",
          content: `Analizá este cartel de licitación costarricense:\n\n${textoCartel}`,
        },
      ],
    });

    const tokensUsados =
      message.usage.input_tokens + message.usage.output_tokens;
    const costoUsd = calcularCostoAnalisis(tokensUsados);

    let resultado: AnalisisResultado;
    try {
      const rawText =
        message.content[0].type === "text" ? message.content[0].text : "";
      resultado = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PARSE_ERROR",
            message: "Error procesando la respuesta de IA. Intentá de nuevo.",
          },
        },
        { status: 500 }
      );
    }

    const { data: analisis, error: dbError } = await supabase
      .from("analisis_carteles")
      .insert({
        user_id: user.id,
        licitacion_id: licitacionId ?? null,
        texto_original: textoCartel.slice(0, 10_000),
        resumen: resultado.resumen_ejecutivo,
        requisitos: resultado.requisitos as unknown as import("@/types/database").Json,
        score_viabilidad: resultado.score_viabilidad,
        documentos_necesarios: resultado.documentos_necesarios,
        observaciones_ia: resultado.razon_score,
        tokens_usados: tokensUsados,
        costo_usd: costoUsd,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[api/analysis/cartel] DB error:", dbError);
    }

    return NextResponse.json({
      success: true,
      data: { analisisId: analisis?.id, resultado },
    });
  } catch (err) {
    console.error("[api/analysis/cartel]", err);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Error interno del servidor" },
      },
      { status: 500 }
    );
  }
}
