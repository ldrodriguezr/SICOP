import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";

type LSEventName =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"
  | "order_created";

interface LSWebhookPayload {
  meta: {
    event_name: LSEventName;
    custom_data?: {
      user_id?: string;
      plan?: string;
    };
  };
  data: {
    id: string;
    attributes: {
      status: string;
      variant_id: number;
      ends_at: string | null;
      renews_at: string | null;
      user_email: string;
    };
  };
}

function planFromStatus(status: string): "free" | "pro" | "business" {
  if (status === "active" || status === "past_due" || status === "unpaid") {
    return "pro"; // overridden below if custom_data has plan
  }
  return "free";
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature") ?? "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as LSWebhookPayload;
    const { event_name, custom_data } = payload.meta;
    const { id: subscriptionId, attributes } = payload.data;
    const userId = custom_data?.user_id;

    if (!userId) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();

    switch (event_name) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_unpaused": {
        const plan = (custom_data?.plan as "pro" | "business") ?? planFromStatus(attributes.status);
        const expiresAt = attributes.ends_at ?? attributes.renews_at;

        await supabase
          .from("user_profiles")
          .update({
            plan: attributes.status === "active" ? plan : "free",
            plan_expires_at: expiresAt,
            stripe_customer_id: subscriptionId,
          })
          .eq("id", userId);

        break;
      }

      case "subscription_cancelled":
      case "subscription_expired":
      case "subscription_paused": {
        await supabase
          .from("user_profiles")
          .update({
            plan: "free",
            plan_expires_at: attributes.ends_at,
          })
          .eq("id", userId);

        break;
      }

      case "order_created":
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[billing/webhook]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
