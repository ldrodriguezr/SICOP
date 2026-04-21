import { NextRequest, NextResponse } from "next/server";
import { syncLicitaciones } from "@/lib/sicop-sync";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { synced, errors } = await syncLicitaciones();

    return NextResponse.json({
      success: true,
      data: { synced, errors },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/sync-sicop]", err);
    return NextResponse.json(
      { success: false, error: "Error en sincronización" },
      { status: 500 }
    );
  }
}
