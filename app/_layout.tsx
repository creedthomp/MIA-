import { useEffect } from "react";
import { View } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { supabase } from "@/services/supabase";
import { useStore } from "@/services/store";
import { fetchProfile } from "@/services/authService";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isAuthLoading, setSession, setProfile } = useStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id).then(setProfile);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id).then(setProfile);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    const inAuth    = segments[0] === "(auth)";
    const onLanding = segments[0] === "(tabs)" && !segments[1];
    const onHub     = segments[0] === "(tabs)" && segments[1] === "play";
    const onLobby   = segments[0] === "lobby";
    const onGame    = segments[0] === "game";

    if (!user) {
      if (onHub || onLobby || onGame) router.replace("/(tabs)");
    } else {
      if (inAuth || onLanding) router.replace("/(tabs)/play");
    }
  }, [user, isAuthLoading, segments]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthGuard />
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}
