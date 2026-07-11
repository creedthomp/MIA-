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
  if (m.includes("already registered")) return "An account with this email already exists.";
  if (m.includes("password"))           return "Password must be at least 6 characters.";
  if (m.includes("valid email"))        return "Please enter a valid email address.";
  return msg;
}

// ── Left brand panel (wide screens only) ──────────────────────
function BrandPanel() {
  return (
    <View style={{ flex: 1, backgroundColor: C.feltA, alignItems: "center", justifyContent: "center", padding: 60 }}>
      <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: C.accent, marginBottom: 44 }}>
        The dice bluffing game
      </Text>

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

// ── Signup form ────────────────────────────────────────────────
function SignupForm({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleSignup() {
    if (!displayName || !email || !password) { setError("Please fill in all fields."); return; }
    setError(null);
    setLoading(true);
    const { error: e } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);
    if (e) setError(friendlyError(e.message));
  }

  const field = (label: string, props: React.ComponentProps<typeof TextInput>) => (
    <View>
      <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.fgFaint, textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </Text>
      <TextInput
        style={{ backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, color: C.fg, fontSize: 15 }}
        placeholderTextColor={C.fgFaint}
        {...props}
      />
    </View>
  );

  return (
    <View style={{ width: "100%", maxWidth: 360 }}>
      <Text style={{ fontSize: compact ? 26 : 32, fontWeight: "700", color: C.fg, letterSpacing: -1, marginBottom: 8 }}>
        Join the table.
      </Text>
      <Text style={{ fontSize: 15, color: C.fgMuted, marginBottom: 36 }}>
        Create your account. It's free.
      </Text>

      <View style={{ gap: 12, marginBottom: 4 }}>
        {field("Display name", {
          placeholder: "How others see you at the table",
          value: displayName,
          onChangeText: (t) => { setDisplayName(t); setError(null); },
        })}
        {field("Email", {
          placeholder: "you@example.com",
          keyboardType: "email-address",
          autoCapitalize: "none",
          autoCorrect: false,
          value: email,
          onChangeText: (t) => { setEmail(t); setError(null); },
        })}
        {field("Password", {
          placeholder: "min 6 characters",
          secureTextEntry: true,
          value: password,
          onChangeText: (t) => { setPassword(t); setError(null); },
        })}
      </View>

      {error && (
        <Text style={{ fontFamily: MONO, fontSize: 12, color: C.danger, marginTop: 10, marginBottom: 4 }}>{error}</Text>
      )}

      <TouchableOpacity
        onPress={handleSignup}
        disabled={loading}
        style={{ backgroundColor: C.accent, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <ActivityIndicator color={C.onAccent} /> : (
          <Text style={{ color: C.onAccent, fontWeight: "600", fontSize: 15 }}>Create account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/(auth)/login" as never)}
        style={{ marginTop: 22, alignItems: "center" }}
      >
        <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgMuted }}>
          Already have an account?{"  "}<Text style={{ color: C.accent }}>Sign in →</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────
export default function SignupScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  if (isWide) {
    return (
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: C.bg }}>
        <BrandPanel />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 60 }}>
          <SignupForm />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28, paddingVertical: 48 }} keyboardShouldPersistTaps="handled">
          <SignupForm compact />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
