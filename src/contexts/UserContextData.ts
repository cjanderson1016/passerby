/*
    File Name: UserContextData.ts

    Description: This file defines the data structures and types for the UserContext.
    
    Author(s): Connor Anderson
*/

import { createContext } from "react";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
}

export interface UserContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

// Context object without any component exports; safe for fast refresh rules
export const UserContext = createContext<UserContextType | undefined>(undefined);
