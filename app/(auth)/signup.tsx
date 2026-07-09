import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { useColorScheme } from "nativewind";
import { supabase } from "@/lib/supabase";

function friendlySignupError(msg: string): string {
  if (msg.toLowerCase().includes("already registered")) return "An account with this email already exists.";
  if (msg.toLowerCase().includes("password")) return "Password must be at least 6 characters.";
  if (msg.toLowerCase().includes("valid email")) return "Please enter a valid email address.";
  return msg;
}

export default function SignupScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  async function handleSignup() {
    if (!displayName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);
    if (signUpError) setError(friendlySignupError(signUpError.message));
    // on success, auth guard in _layout.tsx handles the redirect
  }

  return (
    <View className="flex-1 bg-canvas dark:bg-surface items-center justify-center px-6">
      <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-8">Create Account</Text>

      <TextInput
        className="w-full bg-card dark:bg-panel text-gray-900 dark:text-white rounded-xl px-4 py-3 mb-3 text-base border border-gray-200 dark:border-transparent"
        placeholder="Display name"
        placeholderTextColor={isDark ? "#a0a0b0" : "#9ca3af"}
        value={displayName}
        onChangeText={(t) => { setDisplayName(t); setError(null); }}
      />
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
        placeholder="Password (min 6 characters)"
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
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">Sign Up</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity>
          <Text className="text-gray-500 dark:text-muted text-sm">Already have an account? Sign in</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
