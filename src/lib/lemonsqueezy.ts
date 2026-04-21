import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
  cancelSubscription,
  type NewCheckout,
} from "@lemonsqueezy/lemonsqueezy.js";

function setup() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) throw new Error("LEMONSQUEEZY_API_KEY no configurada");
  lemonSqueezySetup({ apiKey });
}

export const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID ?? "";

export const LS_VARIANT_IDS: Record<"pro" | "business", string> = {
  pro: process.env.LEMONSQUEEZY_VARIANT_PRO ?? "",
  business: process.env.LEMONSQUEEZY_VARIANT_BUSINESS ?? "",
};

export type BillingPlan = "pro" | "business";

export interface CreateCheckoutParams {
  plan: BillingPlan;
  userId: string;
  email: string;
  name: string;
  successUrl?: string;
}

export async function createBillingCheckout({
  plan,
  userId,
  email,
  name,
  successUrl,
}: CreateCheckoutParams): Promise<{ checkoutUrl: string }> {
  setup();

  const variantId = LS_VARIANT_IDS[plan];
  if (!variantId) {
    throw new Error(`Variant ID para plan "${plan}" no configurado`);
  }

  const checkoutData: NewCheckout = {
    productOptions: {
      redirectUrl: successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/settings/plan?success=1`,
      receiptThankYouNote: "Gracias por confiar en SICOP Copilot.",
    },
    checkoutOptions: {
      embed: false,
    },
    checkoutData: {
      email,
      name,
      custom: {
        user_id: userId,
        plan,
      },
    },
    expiresAt: null,
    preview: false,
    testMode: process.env.LEMONSQUEEZY_TEST_MODE === "true",
  };

  const { data, error } = await createCheckout(LS_STORE_ID, variantId, checkoutData);

  if (error || !data?.data.attributes.url) {
    throw new Error(error?.message ?? "No se pudo crear el checkout");
  }

  return { checkoutUrl: data.data.attributes.url };
}

export async function getBillingSubscription(subscriptionId: string) {
  setup();
  const { data, error } = await getSubscription(subscriptionId);
  if (error) throw new Error(error.message);
  return data?.data;
}

export async function cancelBillingSubscription(subscriptionId: string) {
  setup();
  const { data, error } = await cancelSubscription(subscriptionId);
  if (error) throw new Error(error.message);
  return data?.data;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;

  const crypto = require("crypto") as typeof import("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(digest, "hex"),
    Buffer.from(signature, "hex")
  );
}
