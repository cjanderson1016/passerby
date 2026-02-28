/*
    File Name: UserContextData.ts

    Description: This file defines the data structures and types for the UserContext.
    
    Author(s): Connor Anderson
*/

import { createContext } from "react";
import type { User } from "@supabase/supabase-js";

// The UserProfile type represents the additional profile information we store in our public.users table,
// such as username, first_name, and last_name. This is separate from the auth.users table which only has basic auth info.
// NOT the same as the auth.users table which only has email, id, etc. and is accessed via supabase.auth.getUser()
export interface UserProfile {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
}

// The UserContextType defines the shape of the context value that will be provided by the UserProvider.
export interface UserContextType {
  user: User | null; // This is the authenticated user object from Supabase, which includes basic auth info like id and email
  userProfile: UserProfile | null; // This is the additional profile info we fetch from our public.users table based on the authenticated user's id
  loading: boolean; // Indicates whether the user data is still loading (e.g. fetching session or profile data)
}

// Context object without any component exports; safe for fast refresh rules
export const UserContext = createContext<UserContextType | undefined>(undefined);
