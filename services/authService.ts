import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "./supabase";
import type { Profile } from "@/types/auth";

// Completes any pending browser auth session (no-op on native)
WebBrowser.maybeCompleteAuthSession();

async function createSessionFromUrl(url: string): Promise<string | null> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) return errorCode;

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    return error?.message ?? null;
  }
  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    return error?.message ?? null;
  }
  return "Sign-in did not return a session";
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  // Web: full-page redirect; supabase-js picks the session up on return
  if (Platform.OS === "web") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  }

  // Native: open the consent screen in an in-app browser, then exchange
  // the code from the mia:// redirect ourselves
  const redirectTo = makeRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return { error: error?.message ?? "Could not start Google sign-in" };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === "success") {
    return { error: await createSessionFromUrl(result.url) };
  }
  // User closed the browser — not an error worth showing
  return { error: null };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, created_at")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as Profile;
}
