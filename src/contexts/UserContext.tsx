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
  // loading state to indicate if we are still determining the auth state (e.g. fetching session or profile data)
  // initially true until we check the session and fetch profile data on mount
  const [loading, setLoading] = useState(true);
  const profileFetchedRef = useRef<string | null>(null);

  // Fetch user profile data (username, first_name, last_name for now) from database
  const fetchUserProfile = async (userId: string) => {
    // Skip if we are already fetching, or have fetched, this user
    if (profileFetchedRef.current === userId) return;

    // Mark that we are fetching this user's profile to prevent duplicate fetches
    profileFetchedRef.current = userId;

    // Fetch the user's profile data from the "users" table based on their id
    try {
      const { data } = await supabase
        .from("users")
        .select("id, username, first_name, last_name")
        .eq("id", userId)
        .single();
      setUserProfile({
        // set the user id, username, first_name, and last_name in the userProfile state
        id: userId,
        username: data?.username ?? null,
        first_name: data?.first_name ?? null,
        last_name: data?.last_name ?? null,
      });
    } catch (err) {
      // if there is an error fetching the profile, log the error and set userProfile to null
      console.error("error fetching user profile", err);
      setUserProfile(null);
    }
  };

  // On mount, get the current auth session and user, and set up a listener for auth changes (e.g. login, logout) to update the user and userProfile state accordingly. This ensures our context is always in sync with Supabase auth state.
  useEffect(() => {
    // Get initial session and set up auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null; // get the authenticated user from the session, or null if there is no session
      setUser(currentUser); // set the user state to the authenticated user (or null if not authenticated)
      if (currentUser?.id) {
        // if there is an authenticated user, fetch their profile data
        fetchUserProfile(currentUser.id);
      } else {
        // if there is no authenticated user, ensure userProfile is null and reset the fetched ref
        setUserProfile(null);
        profileFetchedRef.current = null; // reset the fetched ref so that if a user logs in later, we will fetch their profile
      }
      setLoading(false); // we have determined the auth state and fetched profile data if needed, so we can set loading to false
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true); // we are now determining the new auth state, so set loading to true until we have handled the auth change and fetched profile data if needed
      const currentUser = session?.user ?? null; // get the authenticated user from the session, or null if there is no session
      setUser(currentUser); // update the user state to the authenticated user (or null if not authenticated)
      if (currentUser?.id) {
        // if there is an authenticated user, fetch their profile data
        fetchUserProfile(currentUser.id);
      } else {
        // if there is no authenticated user (e.g. they logged out), ensure userProfile is null and reset the fetched ref
        setUserProfile(null);
        profileFetchedRef.current = null; // reset the fetched ref so that if a user logs in later, we will fetch their profile
      }
      setLoading(false); // we have handled the auth change and fetched profile data if needed, so we can set loading to false
    });

    return () => subscription.unsubscribe(); // Clean up the subscription on unmount
  }, []);

  // The context value includes:
  //    the authenticated user object from Supabase, (user)
  //    the additional profile info we fetch from our users table, (userProfile)
  //    and a loading state to indicate if we are still determining the auth state. (loading)
  return (
    <UserContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
}
