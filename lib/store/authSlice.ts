import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "@/types/auth";

export interface AuthSlice {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  clearAuth: () => void;
}

export const createAuthSlice = (
  set: (fn: (state: AuthSlice) => Partial<AuthSlice>) => void
): AuthSlice => ({
  user: null,
  session: null,
  profile: null,
  isAuthLoading: true,

  setSession: (session) =>
    set(() => ({
      session,
      user: session?.user ?? null,
      isAuthLoading: false,
    })),

  setProfile: (profile) => set(() => ({ profile })),

  clearAuth: () =>
    set(() => ({
      user: null,
      session: null,
      profile: null,
      isAuthLoading: false,
    })),
});
