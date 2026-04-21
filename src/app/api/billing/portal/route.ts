import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBillingSubscription } from "@/lib/lemonsqueezy";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id, plan")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id || profile.plan === "free") {
      return NextResponse.json(
        { error: "No tenés una suscripción activa" },
        { status: 400 }
      );
    }

    const subscription = await getBillingSubscription(profile.stripe_customer_id);
    const portalUrl =
      (subscription as unknown as { attributes: { urls: { customer_portal: string } } })
        ?.attributes?.urls?.customer_portal;

    if (!portalUrl) {
      return NextResponse.json(
        { error: "Portal no disponible" },
        { status: 404 }
      );
    }

    return NextResponse.json({ portalUrl });
  } catch (err) {
    console.error("[billing/portal]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
