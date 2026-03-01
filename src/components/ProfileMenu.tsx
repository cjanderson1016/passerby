import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../features/dashboard.css"; // keep existing styles

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const toggle = () => setOpen((v) => !v);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Error signing out:", error);
      // App.tsx listens to auth changes and will redirect to login.
    } catch (err) {
      console.error("Unexpected error during signout:", err);
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  };

  // fetch username once if we don't already have it
  useEffect(() => {
    const fetchUsername = async () => {
      if (username) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) return;
        const { data } = await supabase
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single();
        setUsername(data?.username ?? null);
      } catch (err) {
        console.error("error fetching username for profile link", err);
      }
    };
    fetchUsername();
  }, [username]);

  // close dropdown when clicking outside
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      if (!wrap.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // close with Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const gotoProfile = async () => {
    setOpen(false);
    let usernameToUse = username;
    if (!usernameToUse) {
      // try to lazy load if still missing
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          const { data } = await supabase
            .from("users")
            .select("username")
            .eq("id", user.id)
            .single();
          usernameToUse = data?.username ?? null;
        }
      } catch (err) {
        console.error("unable to lazy-load username", err);
      }
    }
    if (usernameToUse) {
      navigate(`/profile/${usernameToUse}`);
    } else {
      navigate("/profile");
    }
  };

  return (
    <div className="dash-profile-wrap" ref={wrapRef}>
      <button
        className="dash-profile"
        onClick={toggle}
        aria-label="Profile menu"
        aria-expanded={open}
      >
        <span className="dash-profile-circle" />
      </button>

      {open && (
        <div
          className="dash-profile-menu"
          role="menu"
          aria-label="Profile options"
        >
          <button
            className="dash-menu-item"
            onClick={gotoProfile}
            role="menuitem"
          >
            Profile
          </button>

          <button className="dash-menu-item"
          onClick={() => navigate("/Settings")}>
            Settings
          </button>

          <button
            className="dash-menu-item danger"
            onClick={handleSignOut}
            disabled={signingOut}
            role="menuitem"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>

        </div>
      )}
    </div>
  );
}
