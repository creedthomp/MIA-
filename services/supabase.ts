import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { Database } from "@/types/supabase";

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On web the OAuth redirect lands back on the app with a ?code param —
    // let supabase-js pick it up. On native we exchange it manually.
    detectSessionInUrl: Platform.OS === "web",
    flowType: "pkce",
  },
});
