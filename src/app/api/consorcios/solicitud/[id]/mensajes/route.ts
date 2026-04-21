import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getSolicitudOrError(
  solicitudId: string,
  userId: string
) {
  const supabase = await createClient();
  const { data: solicitud } = await supabase
    .from("consorcio_solicitudes")
    .select("*")
    .eq("id", solicitudId)
    .maybeSingle();

  if (!solicitud) {
    return { supabase, error: "NOT_FOUND" as const, solicitud: null };
  }

  const isParticipant =
    solicitud.solicitante_id === userId || solicitud.receptor_id === userId;

  if (!isParticipant) {
    return { supabase, error: "FORBIDDEN" as const, solicitud: null };
  }

  return { supabase, error: null, solicitud };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Sesión requerida" },
        },
        { status: 401 }
      );
    }

    const { supabase, error, solicitud } = await getSolicitudOrError(id, user.id);

    if (error === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: { code: error, message: "Solicitud no encontrada" } },
        { status: 404 }
      );
    }

    if (error === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: { code: error, message: "Sin acceso a esta conversación" } },
        { status: 403 }
      );
    }

    const { data: mensajes } = await supabase
      .from("consorcio_mensajes")
      .select("*")
      .eq("solicitud_id", id)
      .order("created_at", { ascending: true });

    await supabase
      .from("consorcio_mensajes")
      .update({ read_at: new Date().toISOString() })
      .eq("solicitud_id", id)
      .neq("sender_id", user.id)
      .is("read_at", null);

    return NextResponse.json({ success: true, data: { solicitud, mensajes: mensajes ?? [] } });
  } catch (error) {
    console.error("[api/consorcios/solicitud/[id]/mensajes GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Error interno" },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

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
    const mensaje = String(body.mensaje ?? "").trim();

    if (!mensaje) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Mensaje requerido" },
        },
        { status: 400 }
      );
    }

    const { supabase, error, solicitud } = await getSolicitudOrError(id, user.id);

    if (error === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: { code: error, message: "Solicitud no encontrada" } },
        { status: 404 }
      );
    }

    if (error === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: { code: error, message: "Sin acceso a esta conversación" } },
        { status: 403 }
      );
    }

    if (solicitud.estado === "rechazada") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATE",
            message: "No podés responder una solicitud rechazada",
          },
        },
        { status: 409 }
      );
    }

    const { data, error: insertError } = await supabase
      .from("consorcio_mensajes")
      .insert({
        solicitud_id: id,
        sender_id: user.id,
        mensaje,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;

    const targetUserId =
      user.id === solicitud.receptor_id
        ? solicitud.solicitante_id
        : solicitud.receptor_id;

    await supabase.from("notificaciones").insert({
      user_id: targetUserId,
      tipo: "consorcio_mensaje",
      titulo: "Nuevo mensaje de consorcio",
      mensaje: mensaje.slice(0, 120),
      data: { solicitud_id: id },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[api/consorcios/solicitud/[id]/mensajes POST]", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Error interno" },
      },
      { status: 500 }
    );
  }
}
