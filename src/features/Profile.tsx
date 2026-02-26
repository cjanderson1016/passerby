/*
  File Name: Profile.tsx

  Description: Simple placeholder component for a user's profile page.  We'll expand it later.

  Author(s): Connor Anderson
*/

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// We will need to decide how to load profile pages in the future.
// For now, this just loads the current user's profile based on their session.

type PublicUser = {
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicUser | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) {
          setError("No authenticated user");
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("username, first_name, last_name")
          .eq("id", user.id)
          .single();

        if (error) {
          setError(error.message);
        } else if (mounted) {
          setProfile(data ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName =
    profile && (profile.first_name || profile.last_name)
      ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
      : null;

  return (
    <div
      className="profile-page"
      style={{ padding: "24px", fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {loading ? (
        <h2>Loading profile…</h2>
      ) : error ? (
        <div>
          <h2>Profile</h2>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      ) : (
        <>
          <h1>{displayName ? `Welcome, ${displayName}!` : "Welcome!"}</h1>

          {profile?.username && (
            <p>
              <strong>Username:</strong> @{profile.username}
            </p>
          )}

          {!profile?.username && <p>No username set.</p>}
        </>
      )}

      <Link to="/">← Back to dashboard</Link>
    </div>
  );
}
