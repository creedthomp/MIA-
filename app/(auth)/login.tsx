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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/services/supabase";

const C = {
  bg:        "#0a0a0a",
  surface:   "#0f0f0f",
  border:    "#262626",
  borderSoft:"#1c1c1c",
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

// ── Left brand panel ──────────────────────────────────────────
function BrandPanel() {
  return (
    <View style={{ flex: 1, backgroundColor: C.feltA, alignItems: "center", justifyContent: "center", padding: 60 }}>

      {/* Real logo in white badge */}
      <View style={{
        backgroundColor: "#ffffff",
        borderRadius: 20, padding: 18,
        marginBottom: 44,
        shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
      }}>
        <Image
          source={require("../../assets/mia-logo.png")}
          style={{ width: 148, height: 82, resizeMode: "contain" }}
        />
      </View>

      {/* Stacked dice art — decorative */}
      <View style={{ flexDirection: "row", gap: 14, marginBottom: 44, alignItems: "flex-end" }}>
        {/* Die showing 6 */}
        <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: "#141414", borderWidth: 1, borderColor: "#2a2a2a", justifyContent: "space-between", padding: 9, transform: [{ rotate: "-8deg" }] }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#f4f4f4" }} />
            <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#f4f4f4" }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#f4f4f4" }} />
            <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#f4f4f4" }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#f4f4f4" }} />
            <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#f4f4f4" }} />
          </View>
        </View>

        {/* Die showing 5 */}
        <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: "#141414", borderWidth: 1, borderColor: "#2a2a2a", padding: 10, transform: [{ rotate: "5deg" }] }}>
          <View style={{ flex: 1, justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#f4f4f4" }} />
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#f4f4f4" }} />
            </View>
            <View style={{ alignItems: "center" }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#f4f4f4" }} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#f4f4f4" }} />
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#f4f4f4" }} />
            </View>
          </View>
        </View>

        {/* Die showing 1 — white */}
        <View style={{ width: 80, height: 80, borderRadius: 14, backgroundColor: "#efefef", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-3deg" }] }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: "#141414" }} />
        </View>

        {/* Die showing 2 — small dark, rotated */}
        <View style={{ width: 52, height: 52, borderRadius: 9, backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a", transform: [{ rotate: "12deg" }], position: "relative" }}>
          <View style={{ position: "absolute", width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#f4f4f4", top: 10, left: 10 }} />
          <View style={{ position: "absolute", width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#f4f4f4", bottom: 10, right: 10 }} />
        </View>
      </View>

      <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>
        The dice bluffing game
      </Text>
      <Text style={{ fontSize: 28, fontWeight: "700", color: "#f2f4f6", letterSpacing: -1, textAlign: "center", lineHeight: 34 }}>
        Roll. Bluff. Win.
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
        {/* Form panel with ghost dice decor */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 60 }}>
          {/* Ghost dice — top right */}
          <View style={{ position: "absolute", top: 36, right: 36, flexDirection: "row", gap: 10, opacity: 0.05 }}>
            <View style={{ width: 70, height: 70, borderRadius: 12, backgroundColor: C.fg, transform: [{ rotate: "18deg" }] }} />
            <View style={{ width: 52, height: 52, borderRadius: 9, backgroundColor: C.fg, transform: [{ rotate: "-10deg" }], marginTop: 24 }} />
          </View>
          {/* Ghost dice — bottom left */}
          <View style={{ position: "absolute", bottom: 44, left: 28, opacity: 0.04 }}>
            <View style={{ width: 88, height: 88, borderRadius: 16, backgroundColor: C.fg, transform: [{ rotate: "-20deg" }] }} />
          </View>
          <LoginForm />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28, paddingVertical: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo badge on mobile */}
          <View style={{ backgroundColor: "#ffffff", borderRadius: 14, padding: 12, marginBottom: 32 }}>
            <Image
              source={require("../../assets/mia-logo.png")}
              style={{ width: 100, height: 56, resizeMode: "contain" }}
            />
          </View>
          <LoginForm compact />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
