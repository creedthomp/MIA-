import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { useColorScheme } from "nativewind";
import { supabase } from "@/lib/supabase";

function friendlyLoginError(msg: string): string {
  if (msg.toLowerCase().includes("invalid login credentials")) return "Incorrect email or password.";
  if (msg.toLowerCase().includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (msg.toLowerCase().includes("too many requests")) return "Too many attempts. Please wait a moment and try again.";
  return msg;
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  async function handleLogin() {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginError) setError(friendlyLoginError(loginError.message));
    // on success, auth guard in _layout.tsx handles the redirect
  }

  return (
    <View className="flex-1 bg-canvas dark:bg-surface items-center justify-center px-6">
      <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-8">Mia</Text>

      <TextInput
        className="w-full bg-card dark:bg-panel text-gray-900 dark:text-white rounded-xl px-4 py-3 mb-3 text-base border border-gray-200 dark:border-transparent"
        placeholder="Email"
        placeholderTextColor={isDark ? "#a0a0b0" : "#9ca3af"}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(t) => { setEmail(t); setError(null); }}
      />
      <TextInput
        className="w-full bg-card dark:bg-panel text-gray-900 dark:text-white rounded-xl px-4 py-3 mb-3 text-base border border-gray-200 dark:border-transparent"
        placeholder="Password"
        placeholderTextColor={isDark ? "#a0a0b0" : "#9ca3af"}
        secureTextEntry
        value={password}
        onChangeText={(t) => { setPassword(t); setError(null); }}
      />

      {error && (
        <Text className="text-accent text-sm mb-3 text-center">{error}</Text>
      )}

      <TouchableOpacity
        className="w-full bg-accent rounded-xl py-3 items-center mb-4 mt-1"
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">Sign In</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/signup" asChild>
        <TouchableOpacity>
          <Text className="text-gray-500 dark:text-muted text-sm">Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
