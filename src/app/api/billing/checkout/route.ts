import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBillingCheckout, type BillingPlan } from "@/lib/lemonsqueezy";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body as { plan: BillingPlan };

    if (!plan || !["pro", "business"].includes(plan)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("nombre_empresa, nombre_contacto, plan")
      .eq("id", user.id)
      .single();

    if (profile?.plan === plan) {
      return NextResponse.json(
        { error: "Ya tenés ese plan activo" },
        { status: 400 }
      );
    }

    const { checkoutUrl } = await createBillingCheckout({
      plan,
      userId: user.id,
      email: user.email ?? "",
      name:
        profile?.nombre_empresa ??
        profile?.nombre_contacto ??
        user.email ??
        "",
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/settings/plan?success=1`,
    });

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("[billing/checkout]", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
