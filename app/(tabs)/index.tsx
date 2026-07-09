import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { createRoom, joinByCode, findOrJoinQuickMatch } from "@/lib/roomService";

export default function HomeScreen() {
  const { profile, user } = useStore();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState<"create" | "quick" | "join" | null>(null);
  const [homeError, setHomeError] = useState<string | null>(null);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

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
    <View className="flex-1 items-center justify-center bg-canvas dark:bg-surface px-6">
      <Text className="text-gray-900 dark:text-white text-4xl font-bold mb-2">Mia</Text>
      {profile && (
        <Text className="text-gray-500 dark:text-muted text-base mb-10">
          Welcome, {profile.display_name}
        </Text>
      )}

      <TouchableOpacity
        className="w-full bg-accent rounded-xl py-3 items-center mb-3"
        onPress={handleCreateGame}
        disabled={!!loading}
      >
        {loading === "create" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">Create Game</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="w-full bg-card dark:bg-panel border border-accent rounded-xl py-3 items-center mb-3"
        onPress={handleQuickMatch}
        disabled={!!loading}
      >
        {loading === "quick" ? (
          <ActivityIndicator color="#e94560" />
        ) : (
          <Text className="text-accent font-semibold text-base">Quick Match</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="w-full bg-card dark:bg-panel border border-gray-200 dark:border-muted rounded-xl py-3 items-center mb-3"
        onPress={() => { setHomeError(null); setJoinModalVisible(true); }}
        disabled={!!loading}
      >
        <Text className="text-gray-900 dark:text-white font-semibold text-base">Join Game</Text>
      </TouchableOpacity>

      {homeError && (
        <Text className="text-accent text-sm mb-3 text-center">{homeError}</Text>
      )}

      <TouchableOpacity className="mt-8" onPress={() => supabase.auth.signOut()}>
        <Text className="text-gray-500 dark:text-muted text-sm">Sign out</Text>
      </TouchableOpacity>

      {/* Join by code modal */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeJoinModal}
      >
        <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View className="w-full bg-card dark:bg-panel rounded-2xl p-6">
            <Text className="text-gray-900 dark:text-white text-xl font-bold mb-1">
              Join Game
            </Text>
            <Text className="text-gray-500 dark:text-muted text-sm mb-4">
              Enter the 6-character room code
            </Text>
            <TextInput
              className="w-full bg-canvas dark:bg-surface text-gray-900 dark:text-white rounded-xl px-4 py-3 mb-2 text-center text-2xl font-bold tracking-widest border border-gray-200 dark:border-transparent"
              placeholder="ABC123"
              placeholderTextColor={isDark ? "#a0a0b0" : "#9ca3af"}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              value={joinCode}
              onChangeText={(t) => { setJoinCode(t); setJoinError(null); }}
            />
            {joinError && (
              <Text className="text-accent text-sm mb-3 text-center">{joinError}</Text>
            )}
            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                className="flex-1 bg-gray-100 dark:bg-surface rounded-xl py-3 items-center"
                onPress={closeJoinModal}
              >
                <Text className="text-gray-600 dark:text-muted font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-xl py-3 items-center ${joinCode.length === 6 ? "bg-accent" : "bg-gray-200 dark:bg-panel"}`}
                onPress={handleJoinByCode}
                disabled={joinCode.length !== 6 || loading === "join"}
              >
                {loading === "join" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className={`font-semibold ${joinCode.length === 6 ? "text-white" : "text-gray-400 dark:text-muted"}`}>
                    Join
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
