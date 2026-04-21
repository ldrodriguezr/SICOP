import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Sesión requerida" },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const receptorId = String(body.receptorId ?? "");
    const mensaje = String(body.mensaje ?? "").trim();
    const licitacionId =
      typeof body.licitacionId === "string" && body.licitacionId.length > 0
        ? body.licitacionId
        : null;

    if (!receptorId || !mensaje) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Receptor y mensaje son requeridos",
          },
        },
        { status: 400 }
      );
    }

    if (receptorId === user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "No podés enviarte una solicitud a vos mismo",
          },
        },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("consorcio_solicitudes")
      .select("id, estado")
      .or(
        `and(solicitante_id.eq.${user.id},receptor_id.eq.${receptorId}),and(solicitante_id.eq.${receptorId},receptor_id.eq.${user.id})`
      )
      .in("estado", ["pendiente", "aceptada"])
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_REQUEST",
            message: "Ya existe una solicitud activa con este proveedor",
          },
        },
        { status: 409 }
      );
    }

    const { data: solicitud, error } = await supabase
      .from("consorcio_solicitudes")
      .insert({
        solicitante_id: user.id,
        receptor_id: receptorId,
        licitacion_id: licitacionId,
        mensaje,
      })
      .select("*")
      .single();

    if (error) throw error;

    await supabase.from("consorcio_mensajes").insert({
      solicitud_id: solicitud.id,
      sender_id: user.id,
      mensaje,
    });

    await supabase.from("notificaciones").insert({
      user_id: receptorId,
      tipo: "consorcio_solicitud",
      titulo: "Nueva solicitud de consorcio",
      mensaje: "Tenés una nueva solicitud en la red de consorcios",
      data: {
        solicitud_id: solicitud.id,
        solicitante_id: user.id,
      },
    });

    return NextResponse.json({ success: true, data: solicitud }, { status: 201 });
  } catch (error) {
    console.error("[api/consorcios/solicitud POST]", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Error interno" },
      },
      { status: 500 }
    );
  }
}
