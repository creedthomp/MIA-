import type { Session, User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
}
