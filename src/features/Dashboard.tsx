// This file defines the main dashboard component for the application.

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // Import the pre-configured Supabase client from our lib/supabase.ts file. This keeps our database configuration centralized and reusable across the app.
import RouteButton from "../components/RouteButton"; // Import a reusable Button component for navigation. This is just an example of how we can build out our UI with shared components.

// Lightweight type describing the instrument rows we expect from the DB.
// Adding this helps TypeScript understand shapes used in the UI.
type Instrument = {
  id?: number;
  name: string;
};

function Dashboard() {
  // State holds the fetched instruments. Start with an empty array.
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignout = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      }
    } catch (err) {
      console.error("Unexpected error during signout:", err);
    } finally {
      setSigningOut(false);
    }
  };

  useEffect(() => {
    // `mounted` guard prevents calling `setInstruments` after unmount.
    let mounted = true;

    // Use an async IIFE (Immediately Invoked Function Expression) so we can await inside useEffect.
    (async () => {
      // NOTE: Supabase `from` in v2 typings can expect 2 generics depending on
      // how the client is typed. To avoid the "Expected 2 type arguments"
      // error we call `.from("instruments")` without generics and cast the
      // returned `data` to `Instrument[]` when setting state.
      const { data, error } = await supabase.from("instruments").select("*");

      if (error) {
        // Log and bail on error; don't update state.
        console.error("Error fetching instruments:", error);
        return;
      }

      // Only update state if component is still mounted. Cast `data` to the
      // expected `Instrument[]` shape; `data` may be `null` if no rows exist.
      if (mounted) setInstruments((data ?? []) as Instrument[]);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Render the list of instruments. Use `id` as key when available, fall back
  // to `name` as a stable string key.
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h2>Dashboard Component</h2>
        <button
          onClick={handleSignout}
          disabled={signingOut}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: signingOut ? "#ccc" : "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: signingOut ? "not-allowed" : "pointer",
          }}
        >
          {signingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
      <RouteButton to="/about">Go to About</RouteButton>
      <ul>
        {instruments.map((instrument) => (
          <li key={instrument.id ?? instrument.name}>{instrument.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
