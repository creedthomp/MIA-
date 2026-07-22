import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  ScrollView,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/services/store";
import { supabase } from "@/services/supabase";
import { createRoom, joinByCode, findOrJoinQuickMatch } from "@/services/roomService";
import { startCheckout, fetchEntitlements } from "@/services/purchases";

import { COLORS, FONT } from "@/theme";

const C = COLORS;
const MONO = FONT.brand;

type Tab = "play" | "shop" | "rules" | "leaderboard" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "play",        label: "Play" },
  { id: "shop",        label: "Shop" },
  { id: "rules",       label: "Rules" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "settings",    label: "Settings" },
];

// ── Tab bar ──────────────────────────────────────────────────────
function TabBar({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }) {
  return (
    <View style={{
      flexDirection: "row", flexShrink: 0,
      paddingHorizontal: 16, paddingVertical: 10, gap: 6,
      borderBottomWidth: 1, borderBottomColor: C.borderSoft,
    }}>
      {TABS.map((t) => {
        const on = active === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            onPress={() => onSelect(t.id)}
            style={{
              paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999,
              backgroundColor: on ? C.accent : "transparent",
              borderWidth: 1, borderColor: on ? C.accent : C.border,
            }}
          >
            <Text style={{
              fontFamily: MONO, fontSize: 12,
              color: on ? C.onAccent : C.fgMuted,
              fontWeight: on ? "600" : "400",
            }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Rules tab ────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.fgFaint, textTransform: "uppercase", marginBottom: 12 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function RuleRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flexDirection: "row", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.borderSoft }}>
      <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgFaint, flex: 1 }}>{label}</Text>
      <Text style={{ fontFamily: MONO, fontSize: 12, color: accent ? C.accent : C.fg, fontWeight: "600", flex: 1, textAlign: "right" }}>{value}</Text>
    </View>
  );
}

function RulesTab() {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 56 }}>
      <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 4, color: C.accent, textTransform: "uppercase", marginBottom: 8 }}>
        How to play
      </Text>
      <Text style={{ fontSize: 26, fontWeight: "700", color: C.fg, letterSpacing: -0.5, marginBottom: 32 }}>
        The Rules
      </Text>

      <Section title="Overview">
        <Text style={{ fontSize: 14, lineHeight: 23, color: C.fgMuted, marginBottom: 14 }}>
          One player at a time, each roll is a secret, each claim is a gamble — and the only thing the table knows for sure is that someone, eventually, is lying.
          {"\n\n"}Each player starts with 5 lives. Lose all your lives and you're out. Last one standing wins.
        </Text>
        <RuleRow label="Players" value="2 or more" />
        <RuleRow label="Equipment" value="2 dice + 1 cup" />
        <RuleRow label="Turn order" value="Sequential around the table" />
      </Section>

      <Section title="How it works">
        <Text style={{ fontSize: 14, lineHeight: 23, color: C.fgMuted, marginBottom: 10 }}>
          Roll both dice under your cup. Hide the result. State the roll to the table.
          {"\n\n"}With the current claim, the next player must roll the same number or higher. If your actual roll meets or beats the previous claim, state it honestly. If it doesn't — <Text style={{ color: C.fg, fontStyle: "italic" }}>you must bluff.</Text>
        </Text>
      </Section>

      <Section title="Dice ranking — low to high">
        <RuleRow label="Normal rolls" value="31 through 65" />
        <RuleRow label="Doubles" value="11, 22, 33, 44, 55, 66" />
        <RuleRow label="MiA! · 2·1" value="Beats everything" accent />
      </Section>

      <Section title="Challenging">
        <Text style={{ fontSize: 14, lineHeight: 23, color: C.fgMuted, marginBottom: 14 }}>
          Any player may challenge the current roll. The cup is lifted to reveal the truth.
        </Text>
        <RuleRow label="Bluff caught" value="Liar loses 1 life" accent />
        <RuleRow label="Challenge wrong" value="Challenger loses 2 lives" />
        <Text style={{ fontSize: 13, lineHeight: 21, color: C.fgFaint, marginTop: 12 }}>
          The winner of the challenge starts the new round. Board resets — no minimum to beat.
        </Text>
      </Section>

      <Section title="MiA! — the special roll">
        <Text style={{ fontSize: 14, lineHeight: 23, color: C.fgMuted }}>
          If you roll 2·1, you may immediately declare "Mia!" — no bluffing needed.{"\n\n"}
          The next player can still roll Mia, creating a chain of escalating tension until someone breaks and calls the lie.
        </Text>
      </Section>

      <View style={{ borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 22 }}>
        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: C.accent, textTransform: "uppercase", marginBottom: 12 }}>
          The spirit of the game
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 23, color: C.fgMuted, fontStyle: "italic" }}>
          "MiA! rewards patience, punishes greed, and never forgets a good story. It's the game where the quietest player at the table can walk away with the win."{"\n\n"}
          THE DICE NEVER LIE.{"\n"}The players, however, are under no such obligation.
        </Text>
      </View>
    </ScrollView>
  );
}

// ── Leaderboard tab ──────────────────────────────────────────────
function LeaderboardTab() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 4, color: C.fgFaint, textTransform: "uppercase", marginBottom: 14 }}>
        Coming soon
      </Text>
      <Text style={{ fontSize: 24, fontWeight: "700", color: C.fg, letterSpacing: -0.5, textAlign: "center", marginBottom: 12 }}>
        Leaderboard
      </Text>
      <Text style={{ fontSize: 14, color: C.fgMuted, textAlign: "center", lineHeight: 22, maxWidth: 280 }}>
        Track wins, streaks, and the most brazen bluffers at the table. Coming in a future update.
      </Text>
    </View>
  );
}

// ── Shop tab ─────────────────────────────────────────────────────
// Cosmetic catalog. Front-end only for now — "Buy" is stubbed until
// payments are wired (see the Stripe / IAP notes in the PR discussion).
// `itemId` must match a key in supabase/functions/_shared/catalog.ts (the
// server sets the real price). A null itemId is a free default (owned).
const SHOP_CUPS: { itemId: string | null; name: string; tint: string; price: string | null }[] = [
  { itemId: null,          name: "Graphite", tint: "#24262b",        price: null },
  { itemId: "cup_teal",    name: "Teal",     tint: COLORS.accent,    price: "$1.00" },
  { itemId: "cup_magenta", name: "Magenta",  tint: COLORS.secondary, price: "$1.00" },
  { itemId: "cup_amber",   name: "Amber",    tint: COLORS.warn,      price: "$1.00" },
  { itemId: "cup_crimson", name: "Crimson",  tint: "#c0392b",        price: "$1.00" },
  { itemId: "cup_royal",   name: "Royal",    tint: "#5b5bd6",        price: "$1.00" },
];

const SHOP_EMOTES: { itemId: string; emoji: string; label: string; price: string }[] = [
  { itemId: "emote_royalty", emoji: "👑", label: "Royalty",   price: "$1.00" },
  { itemId: "emote_fire",    emoji: "🔥", label: "On fire",   price: "$1.00" },
  { itemId: "emote_clown",   emoji: "🤡", label: "Clown",     price: "$1.00" },
  { itemId: "emote_dead",    emoji: "💀", label: "Dead",      price: "$1.00" },
  { itemId: "emote_cap",     emoji: "🧢", label: "Cap",       price: "$1.00" },
  { itemId: "emote_target",  emoji: "🎯", label: "Called it", price: "$1.00" },
];

// Multiply a hex color's channels by `f` (clamped) for cheap shading.
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  const r = c((n >> 16) & 255), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// A little upright cup: wide mouth (with a visible opening) tapering to a
// narrower base, shaded band-by-band for depth — matches the in-game cup.
function CupSwatch({ tint }: { tint: string }) {
  const bands: { w: number; h: number; c: string; rBottom?: number }[] = [
    { w: 44, h: 9, c: tint },
    { w: 41, h: 9, c: shade(tint, 0.86) },
    { w: 38, h: 9, c: tint },
    { w: 34, h: 7, c: shade(tint, 1.12), rBottom: 5 },
  ];
  return (
    <View style={{ alignItems: "center", marginBottom: 12 }}>
      {/* Mouth rim + dark opening */}
      <View style={{ width: 47, height: 12, borderRadius: 6, backgroundColor: shade(tint, 1.16), alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 35, height: 5, borderRadius: 3, backgroundColor: shade(tint, 0.5) }} />
      </View>
      {bands.map((b, i) => (
        <View
          key={i}
          style={{ width: b.w, height: b.h, backgroundColor: b.c, borderBottomLeftRadius: b.rBottom ?? 0, borderBottomRightRadius: b.rBottom ?? 0 }}
        />
      ))}
      {/* Ground shadow */}
      <View style={{ width: 30, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.35)", marginTop: 3 }} />
    </View>
  );
}

function BuyButton({ price, loading, onPress }: { price: string; loading?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={{ marginTop: 12, alignSelf: "stretch", backgroundColor: C.accent, borderRadius: 8, paddingVertical: 8, alignItems: "center", opacity: loading ? 0.7 : 1 }}
    >
      {loading
        ? <ActivityIndicator color={C.onAccent} size="small" />
        : <Text style={{ color: C.onAccent, fontWeight: "700", fontSize: 13 }}>{price}</Text>}
    </TouchableOpacity>
  );
}

function OwnedChip() {
  return (
    <View style={{ marginTop: 12, alignSelf: "stretch", borderWidth: 1, borderColor: C.success, borderRadius: 8, paddingVertical: 7, alignItems: "center" }}>
      <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1, color: C.success }}>OWNED</Text>
    </View>
  );
}

function ShopTab() {
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [owned, setOwned] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEntitlements().then(setOwned);
  }, []);

  async function buy(itemId: string) {
    setNotice(null);
    setBusy(itemId);
    const { error } = await startCheckout(itemId);
    setBusy(null);
    // On web this redirects away; an error means checkout couldn't start
    // (e.g. payments not configured yet).
    if (error) setNotice(error);
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 56 }}>
      <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 4, color: C.warn, textTransform: "uppercase", marginBottom: 8 }}>
        Cosmetics
      </Text>
      <Text style={{ fontSize: 26, fontWeight: "700", color: C.fg, letterSpacing: -0.5, marginBottom: 20 }}>
        Shop
      </Text>

      {notice && (
        <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.warn, borderRadius: 10, padding: 14, marginBottom: 24 }}>
          <Text style={{ fontFamily: MONO, fontSize: 12, color: C.warn, lineHeight: 18 }}>{notice}</Text>
        </View>
      )}

      <Section title="Cups">
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
          {SHOP_CUPS.map((cup) => {
            const isOwned = cup.itemId === null || owned.has(cup.itemId);
            return (
              <View key={cup.name} style={{ width: "48%", marginBottom: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, alignItems: "center" }}>
                <CupSwatch tint={cup.tint} />
                <Text style={{ fontSize: 15, fontWeight: "600", color: C.fg }}>{cup.name}</Text>
                {isOwned || !cup.price || !cup.itemId
                  ? <OwnedChip />
                  : <BuyButton price={cup.price} loading={busy === cup.itemId} onPress={() => buy(cup.itemId!)} />}
              </View>
            );
          })}
        </View>
      </Section>

      <Section title="Emotes">
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
          {SHOP_EMOTES.map((em) => {
            const isOwned = owned.has(em.itemId);
            return (
              <View key={em.itemId} style={{ width: "48%", marginBottom: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, alignItems: "center" }}>
                <Text style={{ fontSize: 34, marginBottom: 8 }}>{em.emoji}</Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: C.fg }}>{em.label}</Text>
                {isOwned
                  ? <OwnedChip />
                  : <BuyButton price={em.price} loading={busy === em.itemId} onPress={() => buy(em.itemId)} />}
              </View>
            );
          })}
        </View>
      </Section>

      <Text style={{ fontFamily: MONO, fontSize: 11, color: C.fgFaint, lineHeight: 18, textAlign: "center", marginTop: 8 }}>
        Cosmetic only — cups and emotes never affect gameplay.
      </Text>
    </ScrollView>
  );
}

// ── Settings tab ─────────────────────────────────────────────────
function SettingsTab() {
  const { user, profile, setProfile, emotesMuted, setEmotesMuted } = useStore();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    if (!user || !name.trim()) return;
    setSaving(true);
    setSaveError(null);
    const { data, error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim() })
      .eq("id", user.id)
      .select()
      .single();
    setSaving(false);
    if (error) { setSaveError("Failed to save. Try again."); return; }
    if (data) setProfile(data as Parameters<typeof setProfile>[0]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 56 }}>
      <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 4, color: C.accent, textTransform: "uppercase", marginBottom: 8 }}>
        Account
      </Text>
      <Text style={{ fontSize: 26, fontWeight: "700", color: C.fg, letterSpacing: -0.5, marginBottom: 32 }}>
        Settings
      </Text>

      {/* Display name */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.fgFaint, textTransform: "uppercase", marginBottom: 10 }}>
          Display name
        </Text>
        <TextInput
          style={{
            backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
            borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16,
            color: C.fg, fontSize: 15, marginBottom: 10,
          }}
          placeholderTextColor={C.fgFaint}
          value={name}
          onChangeText={(t) => { setName(t); setSaved(false); setSaveError(null); }}
        />
        {saveError && (
          <Text style={{ fontFamily: MONO, fontSize: 11, color: C.danger, marginBottom: 8 }}>{saveError}</Text>
        )}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !name.trim()}
          style={{
            backgroundColor: saved ? "#0f2010" : C.surface,
            borderWidth: 1,
            borderColor: saved ? C.success : C.border,
            borderRadius: 10, paddingVertical: 12, alignItems: "center",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color={C.fgMuted} size="small" />
          ) : (
            <Text style={{ fontFamily: MONO, fontSize: 12, color: saved ? C.success : C.fgMuted }}>
              {saved ? "Saved" : "Save changes"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Email (read-only) */}
      <View style={{ marginBottom: 40 }}>
        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.fgFaint, textTransform: "uppercase", marginBottom: 10 }}>
          Email
        </Text>
        <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16 }}>
          <Text style={{ color: C.fgFaint, fontSize: 15 }}>{user?.email ?? "—"}</Text>
        </View>
      </View>

      {/* Table preferences */}
      <View style={{ marginBottom: 40 }}>
        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.fgFaint, textTransform: "uppercase", marginBottom: 10 }}>
          Table
        </Text>
        <View
          style={{
            backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 10,
            paddingVertical: 12, paddingHorizontal: 16,
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: C.fg, fontSize: 15, marginBottom: 2 }}>Mute emotes</Text>
            <Text style={{ color: C.fgFaint, fontSize: 12 }}>
              Hide other players' taunts during games. Yours still send.
            </Text>
          </View>
          <Switch
            value={emotesMuted}
            onValueChange={setEmotesMuted}
            trackColor={{ false: "#2a2a2a", true: C.accent }}
            thumbColor="#f4f4f4"
          />
        </View>
      </View>

      {/* Sign out */}
      <View style={{ borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 28 }}>
        <TouchableOpacity
          onPress={() => supabase.auth.signOut()}
          style={{ borderWidth: 1, borderColor: C.danger, borderRadius: 10, paddingVertical: 13, alignItems: "center" }}
        >
          <Text style={{ fontFamily: MONO, fontSize: 12, color: C.danger }}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Screen ────────────────────────────────────────────────────────
export default function PlayScreen() {
  const { profile, user } = useStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 700;
  const maxW = Math.min(width, 560);

  const [activeTab,        setActiveTab]        = useState<Tab>("play");
  const [loading,          setLoading]          = useState<"create" | "quick" | "join" | null>(null);
  const [homeError,        setHomeError]        = useState<string | null>(null);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinCode,         setJoinCode]         = useState("");
  const [joinError,        setJoinError]        = useState<string | null>(null);

  async function handleCreateGame() {
    if (!user) return;
    setHomeError(null);
    setLoading("create");
    const { roomId, error } = await createRoom(user.id, "private");
    setLoading(null);
    if (error || !roomId) { setHomeError(error ?? "Failed to create room"); return; }
    router.push(`/lobby/${roomId}` as never);
  }

  async function handleQuickMatch() {
    if (!user) return;
    setHomeError(null);
    setLoading("quick");
    const { roomId, error } = await findOrJoinQuickMatch(user.id);
    setLoading(null);
    if (error || !roomId) { setHomeError(error ?? "Failed to find match"); return; }
    router.push(`/lobby/${roomId}` as never);
  }

  async function handleJoinByCode() {
    if (!user || joinCode.length !== 6) return;
    setJoinError(null);
    setLoading("join");
    const { roomId, error } = await joinByCode(joinCode, user.id);
    setLoading(null);
    if (error || !roomId) { setJoinError(error ?? "Room not found"); return; }
    setJoinModalVisible(false);
    setJoinCode("");
    router.push(`/lobby/${roomId}` as never);
  }

  function closeJoinModal() {
    setJoinModalVisible(false);
    setJoinCode("");
    setJoinError(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Color-block strip ── */}
        <View style={{ flexDirection: "row", height: 4 }}>
          <View style={{ flex: 1, backgroundColor: C.accent }} />
          <View style={{ flex: 1, backgroundColor: C.secondary }} />
          <View style={{ flex: 1, backgroundColor: C.warn }} />
        </View>

        {/* ── Header ── */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: 24, paddingTop: 14, paddingBottom: 10,
          borderBottomWidth: 1, borderBottomColor: C.borderSoft,
        }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 }}>
            <Image source={require("../../assets/mia-logo.png")} style={{ width: 52, height: 29, resizeMode: "contain" }} />
          </View>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 16 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.success }} />
            <Text style={{ fontSize: 13, color: C.fgMuted }}>
              {profile?.display_name ?? "player"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => supabase.auth.signOut()}>
            <Text style={{ fontFamily: MONO, fontSize: 10, color: C.fgFaint, letterSpacing: 2, textTransform: "uppercase" }}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tab bar ── */}
        <TabBar active={activeTab} onSelect={(t) => { setActiveTab(t); setHomeError(null); }} />

        {/* ── Play tab ── */}
        {activeTab === "play" && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
            <View style={{ width: "100%", maxWidth: maxW }}>

              {homeError && (
                <Text style={{ fontFamily: MONO, fontSize: 12, color: C.danger, marginBottom: 16 }}>{homeError}</Text>
              )}

              <TouchableOpacity
                onPress={handleCreateGame}
                disabled={!!loading}
                style={{
                  backgroundColor: C.accent, borderRadius: 14,
                  padding: isWide ? 28 : 22, marginBottom: 12,
                  opacity: loading ? 0.65 : 1,
                }}
              >
                {loading === "create" ? <ActivityIndicator color={C.onAccent} /> : (
                  <>
                    <Text style={{ fontSize: isWide ? 22 : 20, fontWeight: "700", color: C.onAccent }}>Create Game</Text>
                    <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
                      Start a private room and share a code with friends
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={handleQuickMatch}
                  disabled={!!loading}
                  style={{
                    flex: 1, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.secondary,
                    borderRadius: 14, padding: isWide ? 22 : 18, opacity: loading ? 0.65 : 1,
                  }}
                >
                  {loading === "quick" ? <ActivityIndicator color={C.secondary} /> : (
                    <>
                      <Text style={{ fontSize: 17, fontWeight: "600", color: C.secondary, marginBottom: 6 }}>Quick Match</Text>
                      <Text style={{ fontSize: 13, color: C.fgMuted, lineHeight: 19 }}>Jump into a random open table</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setHomeError(null); setJoinModalVisible(true); }}
                  disabled={!!loading}
                  style={{
                    flex: 1, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.secondary,
                    borderRadius: 14, padding: isWide ? 22 : 18, opacity: loading ? 0.65 : 1,
                  }}
                >
                  <Text style={{ fontSize: 17, fontWeight: "600", color: C.secondary, marginBottom: 6 }}>Join with Code</Text>
                  <Text style={{ fontSize: 13, color: C.fgMuted, lineHeight: 19 }}>Enter the 6-character room code</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        )}

        {activeTab === "shop"        && <ShopTab />}
        {activeTab === "rules"       && <RulesTab />}
        {activeTab === "leaderboard" && <LeaderboardTab />}
        {activeTab === "settings"    && <SettingsTab />}

      </SafeAreaView>

      {/* ── Join modal ── */}
      <Modal visible={joinModalVisible} transparent animationType="fade" onRequestClose={closeJoinModal}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, backgroundColor: "rgba(0,0,0,0.75)" }}>
          <View style={{ width: "100%", maxWidth: 440, backgroundColor: C.surface, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: C.accent, textTransform: "uppercase", marginBottom: 10 }}>
              Join Game
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: C.fg, letterSpacing: -0.5, marginBottom: 6 }}>
              Enter table code
            </Text>
            <Text style={{ fontSize: 14, color: C.fgMuted, marginBottom: 22 }}>
              The 6-character code from your host.
            </Text>

            <TextInput
              style={{
                backgroundColor: C.bg, borderWidth: 2,
                borderColor: joinCode.length === 6 ? C.accent : C.border,
                borderRadius: 12, paddingVertical: 14, color: C.fg,
                fontSize: 30, fontFamily: MONO, fontWeight: "700",
                textAlign: "center", letterSpacing: 10,
                marginBottom: joinError ? 8 : 16,
              }}
              placeholder="······"
              placeholderTextColor={C.fgFaint}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              value={joinCode}
              onChangeText={(t) => { setJoinCode(t.toUpperCase()); setJoinError(null); }}
            />

            {joinError && (
              <Text style={{ fontFamily: MONO, fontSize: 11, color: C.danger, textAlign: "center", marginBottom: 12 }}>
                {joinError}
              </Text>
            )}

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={closeJoinModal}
                style={{ flex: 1, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 13, alignItems: "center" }}
              >
                <Text style={{ color: C.fgMuted, fontWeight: "500", fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleJoinByCode}
                disabled={joinCode.length !== 6 || loading === "join"}
                style={{ flex: 1, backgroundColor: joinCode.length === 6 ? C.accent : C.surface2, borderRadius: 10, paddingVertical: 13, alignItems: "center", opacity: joinCode.length !== 6 ? 0.5 : 1 }}
              >
                {loading === "join" ? <ActivityIndicator color={C.onAccent} /> : (
                  <Text style={{ color: joinCode.length === 6 ? C.onAccent : C.fgFaint, fontWeight: "600", fontSize: 14 }}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
