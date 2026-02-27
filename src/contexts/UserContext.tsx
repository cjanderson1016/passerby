/*
  File Name: UserContext.tsx

  Description: Provides a global context for the authenticated user and their profile data.
  This avoids redundant database calls by caching the username and other profile info.

  Author(s): Connor Anderson
*/

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  UserContext,
  type UserProfile,
  // type UserContextType,
} from "./UserContextData";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetchedRef = useRef<string | null>(null);

  // Fetch user profile data (username, first_name, last_name) from database
  const fetchUserProfile = async (userId: string) => {
    // Skip if we're already fetching or have fetched this user
    if (profileFetchedRef.current === userId) return;

    profileFetchedRef.current = userId;
    try {
      const { data } = await supabase
        .from("users")
        .select("id, username, first_name, last_name")
        .eq("id", userId)
        .single();
      setUserProfile({
        id: userId,
        username: data?.username ?? null,
        first_name: data?.first_name ?? null,
        last_name: data?.last_name ?? null,
      });
    } catch (err) {
      console.error("error fetching user profile", err);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // Get initial session and set up auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.id) {
        fetchUserProfile(currentUser.id);
      } else {
        setUserProfile(null);
        profileFetchedRef.current = null;
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.id) {
        fetchUserProfile(currentUser.id);
      } else {
        setUserProfile(null);
        profileFetchedRef.current = null;
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
}
