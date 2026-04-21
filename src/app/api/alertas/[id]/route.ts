import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesión requerida" } },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("alertas_config")
      .update(body)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[api/alertas PUT]", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Error interno" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesión requerida" } },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from("alertas_config")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: null });
  } catch (err) {
    console.error("[api/alertas DELETE]", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Error interno" } },
      { status: 500 }
    );
  }
}
