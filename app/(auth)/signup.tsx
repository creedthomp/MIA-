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
  if (m.includes("already registered")) return "An account with this email already exists.";
  if (m.includes("password"))           return "Password must be at least 6 characters.";
  if (m.includes("valid email"))        return "Please enter a valid email address.";
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
          source={require("../../assets/MiA!logo.PNG")}
          style={{ width: 148, height: 82, resizeMode: "contain" }}
        />
      </View>

      {/* Scattered dice art */}
      <View style={{ flexDirection: "row", gap: 14, marginBottom: 44, alignItems: "flex-end" }}>
        {/* Die showing 2 */}
        <View style={{ width: 52, height: 52, borderRadius: 9, backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a", transform: [{ rotate: "12deg" }], position: "relative" }}>
          <View style={{ position: "absolute", width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#f4f4f4", top: 10, left: 10 }} />
          <View style={{ position: "absolute", width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#f4f4f4", bottom: 10, right: 10 }} />
        </View>

        {/* Die showing 1 — white, tall */}
        <View style={{ width: 80, height: 80, borderRadius: 14, backgroundColor: "#efefef", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-5deg" }] }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: "#141414" }} />
        </View>

        {/* Die showing 4 */}
        <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: "#141414", borderWidth: 1, borderColor: "#2a2a2a", padding: 10, transform: [{ rotate: "8deg" }] }}>
          <View style={{ flex: 1, justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#f4f4f4" }} />
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#f4f4f4" }} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#f4f4f4" }} />
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#f4f4f4" }} />
            </View>
          </View>
        </View>

        {/* Die showing 3 */}
        <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: "#141414", borderWidth: 1, borderColor: "#2a2a2a", padding: 8, transform: [{ rotate: "-9deg" }] }}>
          <View style={{ flex: 1, justifyContent: "space-between" }}>
            <View style={{ alignItems: "flex-end" }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#f4f4f4" }} />
            </View>
            <View style={{ alignItems: "center" }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#f4f4f4" }} />
            </View>
            <View style={{ alignItems: "flex-start" }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#f4f4f4" }} />
            </View>
          </View>
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
        {/* Form panel with ghost dice decor */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 60 }}>
          {/* Ghost dice — top right */}
          <View style={{ position: "absolute", top: 36, right: 36, flexDirection: "row", gap: 10, opacity: 0.05 }}>
            <View style={{ width: 52, height: 52, borderRadius: 9, backgroundColor: C.fg, transform: [{ rotate: "-10deg" }], marginTop: 24 }} />
            <View style={{ width: 70, height: 70, borderRadius: 12, backgroundColor: C.fg, transform: [{ rotate: "18deg" }] }} />
          </View>
          {/* Ghost die — bottom left */}
          <View style={{ position: "absolute", bottom: 44, left: 28, opacity: 0.04 }}>
            <View style={{ width: 88, height: 88, borderRadius: 16, backgroundColor: C.fg, transform: [{ rotate: "22deg" }] }} />
          </View>
          <SignupForm />
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
              source={require("../../assets/MiA!logo.PNG")}
              style={{ width: 100, height: 56, resizeMode: "contain" }}
            />
          </View>
          <SignupForm compact />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
