/*
  File Name: supabase.ts

  Description: Initializes and exports the Supabase client for the Passerby application.
  This file configures the connection to the Supabase backend using
  environment variables provided by Vite (.env.local).

  Author(s): Connor Anderson
  */

import { createClient } from "@supabase/supabase-js";

// These environment variables are defined in the .env.local file at the root of the project. 
// Vite automatically loads these variables and makes them available via import.meta.env. 
// The "VITE_" prefix is required for Vite to expose these variables to the client-side code.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

// Initialize Supabase client using Vite environment variables.
// Note: We’re deliberately keeping the Supabase client untyped to avoid depending
// on auto-generated database types, and we’ll manually type results where necessary.
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
