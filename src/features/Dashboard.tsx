/*
  File Name: Dashboard.tsx

  Description: This file defines the main dashboard component for the application.

  Author(s): Connor Anderson
  */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";
import { supabase } from "../lib/supabase";

type FilterOption =
  | "Most Recently Updated"
  | "Alphabetical (A–Z)"
  | "Unread Messages First"
  | "Closest Friends"; // placeholder for later

type Post = {
  id: string;
  name: string;
  text: string;
  lastUpdatedMinutesAgo: number;
  unreadMessages: boolean;
};

const initialPosts: Post[] = [
  {
    id: "1",
    name: "John Doe",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    lastUpdatedMinutesAgo: 12,
    unreadMessages: true,
  },
  {
    id: "2",
    name: "Alyssa Kim",
    text: "Quick update—just finished a new project and it went really well.",
    lastUpdatedMinutesAgo: 55,
    unreadMessages: false,
  },
  {
    id: "3",
    name: "Sam Patel",
    text: "Anyone free this weekend? Thinking about grabbing coffee.",
    lastUpdatedMinutesAgo: 140,
    unreadMessages: true,
  },
  {
    id: "4",
    name: "Taylor M.",
    text: "Trying a new study routine. It’s actually helping a lot.",
    lastUpdatedMinutesAgo: 300,
    unreadMessages: false,
  },
];

function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

function applyFilter(posts: Post[], filter: FilterOption): Post[] {
  const copy = [...posts];

  switch (filter) {
    case "Most Recently Updated":
      return copy.sort(
        (a, b) => a.lastUpdatedMinutesAgo - b.lastUpdatedMinutesAgo,
      );

    case "Alphabetical (A–Z)":
      return copy.sort((a, b) => a.name.localeCompare(b.name));

    case "Unread Messages First":
      return copy.sort((a, b) => {
        if (a.unreadMessages === b.unreadMessages) {
          return a.lastUpdatedMinutesAgo - b.lastUpdatedMinutesAgo;
        }
        return a.unreadMessages ? -1 : 1;
      });

    case "Closest Friends":
      // placeholder: later sort by closeness score
      return copy;

    default:
      return copy;
  }
}

export default function Dashboard() {
  const [filterOption, setFilterOption] = useState<FilterOption>(
    "Most Recently Updated",
  );

  const [posts, setPosts] = useState<Post[]>(initialPosts);

  // Profile dropdown state
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const profileWrapRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const filteredPosts = useMemo(() => {
    return applyFilter(posts, filterOption);
  }, [posts, filterOption]);

  const onAddFriend = () => {
    // Dummy for now — later open modal and insert real friend
    const newId = String(posts.length + 1);
    setPosts((prev) => [
      ...prev,
      {
        id: newId,
        name: "New Friend",
        text: "New placeholder post (replace with real data later).",
        lastUpdatedMinutesAgo: 5,
        unreadMessages: true,
      },
    ]);
  };

  const toggleProfileMenu = () => {
    setProfileOpen((v) => !v);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Error signing out:", error);
      // App.tsx listens to auth changes; you will automatically return to Login.
    } catch (err) {
      console.error("Unexpected error during signout:", err);
    } finally {
      setSigningOut(false);
      setProfileOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const wrap = profileWrapRef.current;
      if (!wrap) return;
      if (!wrap.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Close dropdown with Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="dash-page">
      {/* Top bar */}
      <div className="dash-topbar">
        <div className="dash-title">PASSERBY</div>

        {/* Profile Circle + Dropdown */}
        <div className="dash-profile-wrap" ref={profileWrapRef}>
          <button
            className="dash-profile"
            onClick={toggleProfileMenu}
            aria-label="Profile menu"
            aria-expanded={profileOpen}
          >
            <span className="dash-profile-circle" />
          </button>

          {profileOpen && (
            <div
              className="dash-profile-menu"
              role="menu"
              aria-label="Profile options"
            >
              <button
                className="dash-menu-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/profile");
                }}
                role="menuitem"
              >
                Profile
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
      </div>

      {/* Filter row */}
      <div className="dash-filter-row">
        <div className="dash-filter-left">
          <div className="dash-filter-label">
            choose a friend to catch up with
          </div>

          <select
            className="dash-select"
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value as FilterOption)}
          >
            <option>Most Recently Updated</option>
            <option>Alphabetical (A–Z)</option>
            <option>Unread Messages First</option>
            <option>Closest Friends</option>
          </select>
        </div>

        <button className="dash-add-btn" onClick={onAddFriend}>
          Add Friend
        </button>
      </div>

      {/* Feed */}
      <div className="dash-feed">
        {filteredPosts.map((p) => (
          <div key={p.id} className="dash-card">
            <div className="dash-avatar" />

            <div className="dash-card-main">
              <div className="dash-card-header">
                <div className="dash-name">{p.name}</div>
                <div className="dash-time">
                  {formatMinutes(p.lastUpdatedMinutesAgo)}
                </div>
              </div>

              <div className="dash-message-box">
                <div className="dash-message">{p.text}</div>
              </div>
            </div>

            <div className="dash-checkwrap">
              <div className="dash-checkbox">
                {p.unreadMessages && <span className="dash-unread-dot" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
