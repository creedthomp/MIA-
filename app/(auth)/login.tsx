import { useState, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing } from "react-native-reanimated";
import { supabase } from "@/services/supabase";
import { signInWithGoogle } from "@/services/authService";

import { COLORS, FONT } from "@/theme";

const C = COLORS;
const MONO = FONT.brand;

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed"))       return "Please confirm your email before signing in.";
  if (m.includes("too many requests"))         return "Too many attempts. Wait a moment and try again.";
  return msg;
}

function FloatDie({ floatAmount, floatDuration, floatDelay = 0, staticRotate = 0, rockDir = 1 as 1 | -1, style, children }: {
  floatAmount: number; floatDuration: number; floatDelay?: number;
  staticRotate?: number; rockDir?: 1 | -1;
  style?: object; children?: React.ReactNode;
}) {
  const yIdle = useSharedValue(0);
  const rockV = useSharedValue(staticRotate);

  useEffect(() => {
    yIdle.value = withDelay(floatDelay, withRepeat(
      withTiming(-floatAmount, { duration: floatDuration, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    ));
    rockV.value = withDelay(floatDelay + 300, withRepeat(
      withTiming(staticRotate + 2 * rockDir, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    ));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: yIdle.value }, { rotate: `${rockV.value}deg` }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
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
        <FloatDie floatAmount={4} floatDuration={1100} floatDelay={0} staticRotate={-8} rockDir={-1} style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: "#141414", borderWidth: 1, borderColor: "#2a2a2a", justifyContent: "space-between", padding: 9 }}>
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
        </FloatDie>

        {/* Die showing 5 */}
        <FloatDie floatAmount={5} floatDuration={950} floatDelay={200} staticRotate={5} rockDir={1} style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: "#141414", borderWidth: 1, borderColor: "#2a2a2a", padding: 10 }}>
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
        </FloatDie>

        {/* Die showing 1 — white */}
        <FloatDie floatAmount={6} floatDuration={1050} floatDelay={450} staticRotate={-3} rockDir={-1} style={{ width: 80, height: 80, borderRadius: 14, backgroundColor: "#efefef", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: "#141414" }} />
        </FloatDie>

        {/* Die showing 2 — small dark, rotated */}
        <FloatDie floatAmount={3} floatDuration={900} floatDelay={650} staticRotate={12} rockDir={1} style={{ width: 52, height: 52, borderRadius: 9, backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a", position: "relative" }}>
          <View style={{ position: "absolute", width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#f4f4f4", top: 10, left: 10 }} />
          <View style={{ position: "absolute", width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#f4f4f4", bottom: 10, right: 10 }} />
        </FloatDie>
      </View>

      <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>
        The dice bluffing game
      </Text>
      <Text style={{ fontSize: 28, fontWeight: "700", letterSpacing: -1, textAlign: "center", lineHeight: 34 }}>
        <Text style={{ color: C.accent }}>Roll.</Text> <Text style={{ color: C.secondary }}>Bluff.</Text> <Text style={{ color: C.warn }}>Win.</Text>
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const { error: e } = await signInWithGoogle();
    setGoogleLoading(false);
    if (e) setError(friendlyError(e));
  }

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

      {/* Divider */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 18 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: C.borderSoft }} />
        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.fgFaint, textTransform: "uppercase" }}>or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: C.borderSoft }} />
      </View>

      {/* Google */}
      <TouchableOpacity
        onPress={handleGoogle}
        disabled={googleLoading || loading}
        style={{
          flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10,
          backgroundColor: "transparent", borderWidth: 1.5, borderColor: C.secondary,
          borderRadius: 10, paddingVertical: 13, opacity: googleLoading ? 0.7 : 1,
        }}
      >
        {googleLoading ? <ActivityIndicator color={C.secondary} /> : (
          <>
            <Ionicons name="logo-google" size={17} color={C.secondary} />
            <Text style={{ color: C.secondary, fontWeight: "600", fontSize: 14 }}>Continue with Google</Text>
          </>
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
