import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";

// ── Design tokens ──────────────────────────────────────────────
const C = {
  bg:        "#0a0a0a",
  surface:   "#0f0f0f",
  surface2:  "#151515",
  elevated:  "#1a1a1a",
  border:    "#262626",
  borderSoft:"#1c1c1c",
  fg:        "#fafafa",
  fgMuted:   "#a3a3a3",
  fgFaint:   "#6f6f6f",
  accent:    "#4d7cff",
  onAccent:  "#ffffff",
  feltA:     "#1d2023",
  feltB:     "#141618",
  feltBorder:"#2b2f33",
  success:   "#3fb950",
  danger:    "#f0553b",
};
const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";
// ───────────────────────────────────────────────────────────────

// ── Animated dice (float) ─────────────────────────────────────
function HeroDice({ size }: { size: number }) {
  const y1 = useSharedValue(0);
  const y2 = useSharedValue(0);

  useEffect(() => {
    y1.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0,   { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    y2.value = withDelay(600, withRepeat(
      withSequence(
        withTiming(-8, { duration: 2300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0,  { duration: 2300, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    ));
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: y1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: y2.value }] }));

  const dot = Math.round(size * 0.16);
  const dotOff = Math.round(size * 0.2);
  const r = Math.round(size * 0.173);
  const offset = Math.round(size * 0.467);

  return (
    <View style={{ position: "relative", height: size * 2 + 40, width: size * 2 + 28, alignItems: "flex-start" }}>
      {/* Dark die — 2 */}
      <Animated.View
        style={[
          {
            width: size, height: size, borderRadius: r,
            backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
          },
          s1,
        ]}
      >
        <View style={{ position: "absolute", width: dot, height: dot, borderRadius: dot / 2, backgroundColor: "#f4f4f4", top: dotOff, left: dotOff }} />
        <View style={{ position: "absolute", width: dot, height: dot, borderRadius: dot / 2, backgroundColor: "#f4f4f4", bottom: dotOff, right: dotOff }} />
      </Animated.View>

      {/* Light die — 1, offset right + down */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: size + 28,
            top: offset,
            width: size, height: size, borderRadius: r,
            backgroundColor: "#efefef",
          },
          s2,
        ]}
      >
        <View
          style={{
            position: "absolute",
            width: dot, height: dot, borderRadius: dot / 2,
            backgroundColor: "#141414",
            top: (size - dot) / 2, left: (size - dot) / 2,
          }}
        />
      </Animated.View>

      {/* Label */}
      <View style={{ position: "absolute", bottom: 0, left: 0 }}>
        <Text style={{ fontFamily: MONO, fontSize: 11, color: C.fgFaint, letterSpacing: 2 }}>
          2 · 1 = MiA! · the highest roll
        </Text>
      </View>
    </View>
  );
}

// ── Step card ─────────────────────────────────────────────────
function StepCard({ n, title, desc, flex }: { n: string; title: string; desc: string; flex?: boolean }) {
  return (
    <View style={{ ...(flex ? { flex: 1 } : {}), backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 28 }}>
      <Text style={{ fontFamily: MONO, fontSize: 13, color: C.fgFaint }}>{n}</Text>
      <Text style={{ fontWeight: "600", fontSize: 20, color: C.fg, marginTop: 14, marginBottom: 10 }}>{title}</Text>
      <Text style={{ fontSize: 15, lineHeight: 24, color: C.fgMuted }}>{desc}</Text>
    </View>
  );
}

// ── Feature card ──────────────────────────────────────────────
function FeatureCard({ title, desc, flex }: { title: string; desc: string; flex?: boolean }) {
  return (
    <View style={{ ...(flex ? { flex: 1 } : {}), borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 28 }}>
      <Text style={{ fontWeight: "600", fontSize: 18, color: C.fg, marginBottom: 8 }}>{title}</Text>
      <Text style={{ fontSize: 14, lineHeight: 23, color: C.fgMuted }}>{desc}</Text>
    </View>
  );
}

// ── Table preview mockup ──────────────────────────────────────
function TableMockup() {
  const players = [
    { i: "RK", active: false, label: "rook" },
    { i: "PR", active: true,  label: "priya · bidding" },
    { i: "JD", active: false, label: "jude" },
    { i: "MX", active: false, label: "max" },
  ];
  return (
    <View style={{ borderRadius: 18, overflow: "hidden", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}>
      {/* Card header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: C.borderSoft }}>
        <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: "700", color: C.fg, letterSpacing: 2 }}>MiA!</Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Text style={{ fontFamily: MONO, fontSize: 11, color: C.fgFaint, letterSpacing: 1 }}>ROUND 07</Text>
          <Text style={{ fontFamily: MONO, fontSize: 11, color: C.accent, letterSpacing: 1 }}>GAME ON</Text>
        </View>
      </View>

      {/* Felt oval */}
      <View style={{ margin: 16, borderRadius: 120, backgroundColor: C.feltA, borderWidth: 1, borderColor: C.feltBorder, height: 290, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
        {/* Players */}
        <View style={{ position: "absolute", top: 22, flexDirection: "row", gap: 18 }}>
          {players.map((p) => (
            <View key={p.i} style={{ alignItems: "center", gap: 5 }}>
              <View
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: "#2a2e32",
                  alignItems: "center", justifyContent: "center",
                  ...(p.active ? { borderWidth: 2, borderColor: C.accent } : {}),
                }}
              >
                <Text style={{ color: p.active ? "#fff" : "#cfd3d6", fontWeight: "700", fontSize: 13 }}>{p.i}</Text>
              </View>
              <Text style={{ fontFamily: MONO, fontSize: 9, color: p.active ? C.accent : "#9aa0a4" }}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* Declaration */}
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 5, color: "#8a9096", textTransform: "uppercase" }}>Priya claims</Text>
          <Text style={{ fontSize: 52, fontWeight: "700", color: "#f2f4f6", letterSpacing: -2, marginTop: 2 }}>5·4</Text>
        </View>

        {/* Bottom — dice + actions */}
        <View style={{ position: "absolute", bottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, width: "100%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: C.accent, textTransform: "uppercase" }}>Your roll</Text>
            {/* Dark die */}
            <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: "#1a1a1a", position: "relative" }}>
              <View style={{ position: "absolute", width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#f4f4f4", top: 7, left: 7 }} />
              <View style={{ position: "absolute", width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#f4f4f4", bottom: 7, right: 7 }} />
            </View>
            {/* Light die */}
            <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#141414" }} />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2 }}>
              <Text style={{ color: C.fg, fontWeight: "500", fontSize: 12 }}>Believe</Text>
            </View>
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: C.danger }}>
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>Call bluff</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Roll in secret",   desc: "Shake both dice under the cup. Only you see the result — everyone else sees the cup." },
  { n: "02", title: "Claim higher",     desc: "Announce a roll higher than the last player. Tell the truth… or lie through your teeth." },
  { n: "03", title: "Call the bluff",   desc: "Doubt them? Lift the cup. Wrong and you lose a life — right and they lose one." },
];

const FEATURES = [
  { title: "Instant tables",   desc: "Create a room in one tap. Share a code and you're dealt in under five seconds." },
  { title: "Private rooms",    desc: "Share a table code and bluff only the people you actually know." },
  { title: "Live multiplayer", desc: "Real-time turns — every roll, declaration, and challenge lands instantly across all players." },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const pad = isWide ? 40 : 24;
  const maxW = Math.min(width, 1180);

  const scrollRef = useRef<ScrollView>(null);
  const howToPlayY = useRef(0);

  const diceSize = isWide ? 150 : 100;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Nav ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: pad,
            paddingVertical: 18,
            borderBottomWidth: 1,
            borderBottomColor: C.borderSoft,
            backgroundColor: C.bg,
          }}
        >
          {/* Logo + nav links */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 28 }}>
            <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: "700", color: C.fg, letterSpacing: 2 }}>MiA!</Text>
            {isWide && (
              <>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgMuted }}>Play</Text>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgMuted }}>Rules</Text>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgMuted }}>Leaderboard</Text>
              </>
            )}
          </View>

          {/* Auth buttons */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <TouchableOpacity onPress={() => router.push("/(auth)/login" as never)}>
              <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: "500", color: C.fg }}>Log in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/signup" as never)}
              style={{ backgroundColor: C.accent, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 8 }}
            >
              <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: "600", color: C.onAccent }}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
          <View style={{ maxWidth: maxW, alignSelf: "center", width: "100%" }}>

            {/* ── HERO ── */}
            <View
              style={{
                flexDirection: isWide ? "row" : "column",
                alignItems: isWide ? "center" : "flex-start",
                paddingHorizontal: pad,
                paddingTop: isWide ? 96 : 52,
                paddingBottom: isWide ? 80 : 52,
                gap: isWide ? 40 : 0,
              }}
            >
              {/* Text */}
              <View style={{ flex: isWide ? 1.05 : undefined }}>
                <Text style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 4, textTransform: "uppercase", color: C.accent }}>
                  The dice bluffing game
                </Text>

                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: isWide ? 82 : 64,
                    lineHeight: isWide ? 77 : 60,
                    letterSpacing: isWide ? -4 : -3,
                    color: C.fg,
                    marginTop: 20,
                  }}
                >
                  {"Roll.\nBluff.\nMiA!"}
                </Text>

                <Text
                  style={{
                    fontSize: 18,
                    lineHeight: 29,
                    color: C.fgMuted,
                    maxWidth: 440,
                    marginTop: 24,
                  }}
                >
                  Two dice, one lie. Announce a higher roll than the last player — or call their bluff. The whole table can smell fear. Can they smell yours?
                </Text>

                {/* Hero CTAs */}
                <View style={{ marginTop: 32, gap: 12 }}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => router.push("/(auth)/signup" as never)}
                      style={{ backgroundColor: C.accent, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 28 }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: "600", color: C.onAccent }}>Play now — free</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => scrollRef.current?.scrollTo({ y: howToPlayY.current, animated: true })}
                      style={{ backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 26 }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: "500", color: C.fg }}>How to play</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.success }} />
                    <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgMuted }}>no download</Text>
                    <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgFaint }}>·</Text>
                    <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgMuted }}>free to play</Text>
                  </View>
                </View>
              </View>

              {/* Dice */}
              <View style={{ flex: isWide ? 0.95 : undefined, alignItems: "center", justifyContent: "center", marginTop: isWide ? 0 : 44, paddingBottom: isWide ? 0 : 8 }}>
                <HeroDice size={diceSize} />
              </View>
            </View>

            {/* ── HOW IT PLAYS ── */}
            <View
              onLayout={(e) => { howToPlayY.current = e.nativeEvent.layout.y; }}
              style={{ borderTopWidth: 1, borderTopColor: C.borderSoft }}
            >
              <View style={{ paddingHorizontal: pad, paddingTop: isWide ? 96 : 64, paddingBottom: isWide ? 96 : 64 }}>
                <Text style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 4, textTransform: "uppercase", color: C.accent }}>
                  Three moves, that's it
                </Text>
                <Text style={{ fontWeight: "700", fontSize: isWide ? 40 : 28, letterSpacing: -1, color: C.fg, marginTop: 16, marginBottom: 0 }}>
                  A round of MiA!
                </Text>

                {isWide ? (
                  <View style={{ flexDirection: "row", gap: 16, marginTop: 40 }}>
                    {STEPS.map((s) => <StepCard key={s.n} {...s} flex />)}
                  </View>
                ) : (
                  <View style={{ gap: 12, marginTop: 32 }}>
                    {STEPS.map((s) => <StepCard key={s.n} {...s} />)}
                  </View>
                )}
              </View>
            </View>

            {/* ── TABLE PREVIEW ── */}
            <View style={{ borderTopWidth: 1, borderTopColor: C.borderSoft }}>
              <View
                style={{
                  paddingHorizontal: pad,
                  paddingTop: isWide ? 96 : 64,
                  paddingBottom: isWide ? 96 : 64,
                  flexDirection: isWide ? "row" : "column",
                  gap: isWide ? 48 : 36,
                  alignItems: isWide ? "center" : "flex-start",
                }}
              >
                {/* Text side */}
                <View style={{ flex: isWide ? 0.9 : undefined }}>
                  <Text style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 4, textTransform: "uppercase", color: C.accent }}>
                    Live tables
                  </Text>
                  <Text style={{ fontWeight: "700", fontSize: isWide ? 40 : 28, letterSpacing: -1, color: C.fg, marginTop: 16 }}>
                    Everyone lies at this table.
                  </Text>
                  <Text style={{ fontSize: 16, lineHeight: 26, color: C.fgMuted, marginTop: 18, maxWidth: 400 }}>
                    Sit down at a charcoal felt with up to five other liars. Your turn glows. Read the room and strike.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/signup" as never)}
                    style={{ marginTop: 26, backgroundColor: C.accent, borderRadius: 8, paddingVertical: 13, paddingHorizontal: 26, alignSelf: "flex-start" }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "600", color: C.onAccent }}>Take a seat</Text>
                  </TouchableOpacity>
                </View>

                {/* Table mockup */}
                <View style={{ flex: isWide ? 1.1 : undefined, width: isWide ? undefined : "100%" }}>
                  <TableMockup />
                </View>
              </View>
            </View>

            {/* ── FEATURES ── */}
            <View style={{ borderTopWidth: 1, borderTopColor: C.borderSoft }}>
              <View style={{ paddingHorizontal: pad, paddingTop: isWide ? 96 : 64, paddingBottom: isWide ? 96 : 64 }}>
                {isWide ? (
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    {FEATURES.map((f) => <FeatureCard key={f.title} {...f} flex />)}
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
                  </View>
                )}
              </View>
            </View>

            {/* ── CTA BAND ── */}
            <View style={{ paddingHorizontal: pad, paddingBottom: isWide ? 96 : 64 }}>
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.feltA,
                  paddingVertical: 64,
                  paddingHorizontal: isWide ? 48 : 28,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "700", fontSize: isWide ? 46 : 30, letterSpacing: -1, color: "#f2f4f6", textAlign: "center" }}>
                  The table's waiting.
                </Text>
                <Text style={{ fontSize: 17, color: "#a8adb2", marginTop: 14, textAlign: "center", maxWidth: 420 }}>
                  Free to play. 30 seconds to learn. A lifetime to master the lie.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/signup" as never)}
                  style={{ backgroundColor: C.accent, borderRadius: 8, paddingVertical: 15, paddingHorizontal: 32, marginTop: 28 }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: C.onAccent }}>Play now — free</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── FOOTER ── */}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: C.border,
                paddingHorizontal: pad,
                paddingTop: isWide ? 48 : 32,
                paddingBottom: isWide ? 56 : 40,
                flexDirection: isWide ? "row" : "column",
                alignItems: isWide ? "center" : "flex-start",
                justifyContent: "space-between",
                gap: isWide ? 0 : 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: "700", color: C.fg, letterSpacing: 2 }}>MiA!</Text>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgFaint }}>© MiA! — 2·1 wins.</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 22 }}>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgMuted }}>Rules</Text>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgMuted }}>Privacy</Text>
              </View>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>

    </View>
  );
}
