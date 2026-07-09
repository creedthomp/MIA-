import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { fetchProfile } from "@/lib/authService";
import { ThemeToggle } from "@/components/ThemeToggle";

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isAuthLoading, setSession, setProfile } = useStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, isAuthLoading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthGuard />
      <View className="flex-1">
        <Slot />
        <ThemeToggle />
      </View>
    </SafeAreaProvider>
  );
}
