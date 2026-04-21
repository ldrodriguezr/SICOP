import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedEstados = ["aceptada", "rechazada", "completada"] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const estado = body.estado as (typeof allowedEstados)[number];

    if (!allowedEstados.includes(estado)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Estado no soportado",
          },
        },
        { status: 400 }
      );
    }

    const { data: solicitud } = await supabase
      .from("consorcio_solicitudes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!solicitud) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Solicitud no encontrada" },
        },
        { status: 404 }
      );
    }

    const isReceptor = solicitud.receptor_id === user.id;
    const isParticipant =
      solicitud.receptor_id === user.id || solicitud.solicitante_id === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "No tenés acceso a esta solicitud" },
        },
        { status: 403 }
      );
    }

    if (estado !== "completada" && !isReceptor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Solo el receptor puede aceptar o rechazar la solicitud",
          },
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("consorcio_solicitudes")
      .update({ estado })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    const targetUserId =
      user.id === solicitud.receptor_id
        ? solicitud.solicitante_id
        : solicitud.receptor_id;

    await supabase.from("notificaciones").insert({
      user_id: targetUserId,
      tipo: "consorcio_estado",
      titulo: "Actualización de solicitud de consorcio",
      mensaje: `La solicitud fue marcada como ${estado}`,
      data: { solicitud_id: id, estado },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[api/consorcios/solicitud/[id] PUT]", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Error interno" },
      },
      { status: 500 }
    );
  }
}
