import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { CATALOG } from "../_shared/catalog.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
// Async crypto provider is required for signature verification in Deno
const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Stripe calls this with no Supabase JWT — set verify_jwt = false in config.toml.
Deno.serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "",
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "bad signature";
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const itemId = session.metadata?.itemId;

    // Only grant items that exist in the server catalog
    if (userId && itemId && CATALOG[itemId]) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      // Idempotent — a duplicate webhook delivery is a no-op
      await supabaseAdmin
        .from("entitlements")
        .upsert(
          { user_id: userId, item_id: itemId, source: "stripe" },
          { onConflict: "user_id,item_id", ignoreDuplicates: true },
        );
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
