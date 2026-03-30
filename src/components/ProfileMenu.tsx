/*
  File Name: ProfileMenu.tsx

  Description: This component implements the profile circle/dropdown in the dashboard header.

  Future: We will add more options to the dropdown in the future, such as links to settings, help, etc. 
  We will also add the profile picture/avatar (uploaded from the profile page/settings)

  Author(s): Connor Anderson
*/

import { useRef, useState, useEffect } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  KeyboardEventHandler,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";
import { getPublicUrl } from "../services/dataService";
import "../features/dashboard.css"; // keep existing styles

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const { userProfile } = useUser();
  const profileImageUrl = userProfile?.profile_pic_key
    ? getPublicUrl(userProfile.profile_pic_key)
    : null;

  const toggle = () => setOpen((v) => !v);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        return;
      }
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Unexpected error during signout:", err);
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  };

  // close dropdown when clicking outside
  // "mousedown" handler attached to the document so we can
  // detect clicks anywhere in the page, not just on the button.
  useEffect(() => {
    const handleDocMouseDown = (e: MouseEvent) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      if (!wrap.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocMouseDown);
    return () => document.removeEventListener("mousedown", handleDocMouseDown);
  }, []);

  const handleKeyDown: KeyboardEventHandler<HTMLButtonElement> = (
    e: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (e.key === "Escape") setOpen(false);
  };

  const gotoProfile = () => {
    setOpen(false);
    if (userProfile?.username) {
      navigate(`/profile/${userProfile.username}`);
    } else {
      navigate("/profile");
    }
  };

  return (
    <div className="dash-profile-wrap" ref={wrapRef}>
      <button
        type="button"
        className="dash-profile"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-label="Profile menu"
        aria-expanded={open}
      >
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt="Your profile"
            className="dash-profile-circle"
          />
        ) : (
          <span className="dash-profile-circle dash-profile-circle--placeholder">
            <span className="material-icons" aria-hidden>
              person
            </span>
          </span>
        )}
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

          <button
            className="dash-menu-item"
            onClick={() => navigate("/Settings")}
          >
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
