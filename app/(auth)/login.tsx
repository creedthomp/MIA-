import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/services/supabase";

const C = {
  bg:        "#0a0a0a",
  surface:   "#0f0f0f",
  border:    "#262626",
  fg:        "#fafafa",
  fgMuted:   "#a3a3a3",
  fgFaint:   "#6f6f6f",
  accent:    "#4d7cff",
  onAccent:  "#ffffff",
  feltA:     "#1d2023",
  danger:    "#f0553b",
};
const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed"))       return "Please confirm your email before signing in.";
  if (m.includes("too many requests"))         return "Too many attempts. Wait a moment and try again.";
  return msg;
}

// ── Left brand panel (wide screens only) ──────────────────────
function BrandPanel() {
  return (
    <View style={{ flex: 1, backgroundColor: C.feltA, alignItems: "center", justifyContent: "center", padding: 60 }}>
      <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: C.accent, marginBottom: 44 }}>
        The dice bluffing game
      </Text>

      {/* Dice art */}
      <View style={{ flexDirection: "row", gap: 22, alignItems: "flex-start", marginBottom: 52 }}>
        <View style={{ width: 110, height: 110, borderRadius: 20, backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a" }}>
          <View style={{ position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: "#f4f4f4", top: 22, left: 22 }} />
          <View style={{ position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: "#f4f4f4", bottom: 22, right: 22 }} />
        </View>
        <View style={{ width: 110, height: 110, borderRadius: 20, backgroundColor: "#efefef", marginTop: 48, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#141414" }} />
        </View>
      </View>

      <Text style={{ fontSize: 52, fontWeight: "700", color: "#f2f4f6", letterSpacing: -3, lineHeight: 50, textAlign: "left", alignSelf: "flex-start" }}>
        {"Roll.\nBluff.\nMiA!"}
      </Text>
    </View>
  );
}

// ── Login form ─────────────────────────────────────────────────
function LoginForm({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setError(null);
    setLoading(true);
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (e) setError(friendlyError(e.message));
  }

  return (
    <View style={{ width: "100%", maxWidth: 360 }}>
      <Text style={{ fontSize: compact ? 26 : 32, fontWeight: "700", color: C.fg, letterSpacing: -1, marginBottom: 8 }}>
        Welcome back.
      </Text>
      <Text style={{ fontSize: 15, color: C.fgMuted, marginBottom: 36 }}>
        Sign in to your account.
      </Text>

      <View style={{ gap: 12, marginBottom: 4 }}>
        <View>
          <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.fgFaint, textTransform: "uppercase", marginBottom: 8 }}>
            Email
          </Text>
          <TextInput
            style={{ backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, color: C.fg, fontSize: 15 }}
            placeholder="you@example.com"
            placeholderTextColor={C.fgFaint}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(t) => { setEmail(t); setError(null); }}
          />
        </View>

        <View>
          <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.fgFaint, textTransform: "uppercase", marginBottom: 8 }}>
            Password
          </Text>
          <TextInput
            style={{ backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, color: C.fg, fontSize: 15 }}
            placeholder="••••••••"
            placeholderTextColor={C.fgFaint}
            secureTextEntry
            value={password}
            onChangeText={(t) => { setPassword(t); setError(null); }}
          />
        </View>
      </View>

      {error && (
        <Text style={{ fontFamily: MONO, fontSize: 12, color: C.danger, marginTop: 10, marginBottom: 4 }}>{error}</Text>
      )}

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{ backgroundColor: C.accent, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <ActivityIndicator color={C.onAccent} /> : (
          <Text style={{ color: C.onAccent, fontWeight: "600", fontSize: 15 }}>Sign in</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/(auth)/signup" as never)}
        style={{ marginTop: 22, alignItems: "center" }}
      >
        <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgMuted }}>
          No account?{"  "}<Text style={{ color: C.accent }}>Sign up →</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────
export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  if (isWide) {
    return (
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: C.bg }}>
        <BrandPanel />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 60 }}>
          <LoginForm />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28, paddingVertical: 48 }} keyboardShouldPersistTaps="handled">
          <LoginForm compact />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
