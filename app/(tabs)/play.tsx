import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/services/store";
import { supabase } from "@/services/supabase";
import { createRoom, joinByCode, findOrJoinQuickMatch } from "@/services/roomService";

const C = {
  bg:        "#0a0a0a",
  surface:   "#0f0f0f",
  surface2:  "#151515",
  border:    "#262626",
  borderSoft:"#1c1c1c",
  fg:        "#fafafa",
  fgMuted:   "#a3a3a3",
  fgFaint:   "#6f6f6f",
  accent:    "#4d7cff",
  onAccent:  "#ffffff",
  success:   "#3fb950",
  danger:    "#f0553b",
};
const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

export default function PlayScreen() {
  const { profile, user } = useStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 700;
  const maxW = Math.min(width, 560);

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

        {/* ── Header ── */}
        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          paddingHorizontal: 24, paddingTop: 14, paddingBottom: 10,
          borderBottomWidth: 1, borderBottomColor: C.borderSoft,
        }}>
          <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: "700", color: C.fg, letterSpacing: 2 }}>MiA!</Text>
          <TouchableOpacity onPress={() => supabase.auth.signOut()}>
            <Text style={{ fontFamily: MONO, fontSize: 10, color: C.fgFaint, letterSpacing: 2, textTransform: "uppercase" }}>Log out</Text>
          </TouchableOpacity>
        </View>

        {/* ── Content ── */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ width: "100%", maxWidth: maxW }}>

            {/* Welcome */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: isWide ? 44 : 36 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.success }} />
              <Text style={{ fontSize: 16, color: C.fgMuted }}>
                Good to have you back,{" "}
                <Text style={{ color: C.fg, fontWeight: "600" }}>{profile?.display_name ?? "player"}</Text>
                {"."}
              </Text>
            </View>

            {homeError && (
              <Text style={{ fontFamily: MONO, fontSize: 12, color: C.danger, marginBottom: 16 }}>{homeError}</Text>
            )}

            {/* Create Game — primary large card */}
            <TouchableOpacity
              onPress={handleCreateGame}
              disabled={!!loading}
              style={{
                backgroundColor: C.accent,
                borderRadius: 14,
                padding: isWide ? 28 : 22,
                marginBottom: 12,
                opacity: loading ? 0.65 : 1,
              }}
            >
              {loading === "create" ? (
                <ActivityIndicator color={C.onAccent} />
              ) : (
                <>
                  <Text style={{ fontSize: isWide ? 22 : 20, fontWeight: "700", color: C.onAccent }}>Create Game</Text>
                  <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
                    Start a private room and share a code with friends
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Quick Match + Join row */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={handleQuickMatch}
                disabled={!!loading}
                style={{
                  flex: 1,
                  backgroundColor: C.surface,
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 14,
                  padding: isWide ? 22 : 18,
                  opacity: loading ? 0.65 : 1,
                }}
              >
                {loading === "quick" ? (
                  <ActivityIndicator color={C.fg} />
                ) : (
                  <>
                    <Text style={{ fontSize: 17, fontWeight: "600", color: C.fg, marginBottom: 6 }}>Quick Match</Text>
                    <Text style={{ fontSize: 13, color: C.fgMuted, lineHeight: 19 }}>Jump into a random open table</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setHomeError(null); setJoinModalVisible(true); }}
                disabled={!!loading}
                style={{
                  flex: 1,
                  backgroundColor: C.surface,
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 14,
                  padding: isWide ? 22 : 18,
                  opacity: loading ? 0.65 : 1,
                }}
              >
                <>
                  <Text style={{ fontSize: 17, fontWeight: "600", color: C.fg, marginBottom: 6 }}>Join with Code</Text>
                  <Text style={{ fontSize: 13, color: C.fgMuted, lineHeight: 19 }}>Enter the 6-character room code</Text>
                </>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </SafeAreaView>

      {/* ── Join modal ── */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeJoinModal}
      >
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
