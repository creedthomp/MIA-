import { Platform } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

// `entitlements` lands in types/supabase.ts after the migration is pushed and
// `bun run types` is run. Until then, use an untyped view of the client for it.
const db = supabase as unknown as SupabaseClient;

// Kicks off Stripe Checkout for a catalog item. On web this redirects the
// tab to Stripe's hosted page; on native it opens an in-app browser.
// Ownership is granted server-side by the stripe-webhook once payment
// clears — never here on the client.
export async function startCheckout(itemId: string): Promise<{ error: string | null }> {
  const origin = Platform.OS === "web" ? window.location.origin : "";

  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { itemId, origin },
  });

  if (error || !data?.url) {
    return { error: data?.error ?? error?.message ?? "Could not start checkout" };
  }

  if (Platform.OS === "web") {
    window.location.assign(data.url as string);
  } else {
    await WebBrowser.openBrowserAsync(data.url as string);
  }
  return { error: null };
}

// The set of item ids the current user owns.
export async function fetchEntitlements(): Promise<Set<string>> {
  const { data, error } = await db.from("entitlements").select("item_id");
  if (error || !data) return new Set();
  return new Set((data as { item_id: string }[]).map((row) => row.item_id));
}
