/*
  File Name: Dashboard.tsx

  Description: This file defines the main dashboard component for the application.

  Author(s): Connor Anderson, Jacob Richards
  */

import { useEffect, useMemo, useState } from "react";
import "./dashboard.css";
import type { Friend } from "../types";
import { supabase } from "../lib/supabase";
import ProfileMenu from "../components/ProfileMenu";
import FriendTable from "../components/FriendTable";
import FriendRequestList from "../components/FriendRequestList";
import AddFriendModal from "../components/AddFriendModal";

type FilterOption =
  | "Most Recently Updated"
  | "Alphabetical (A–Z)"
  | "Unread Messages First"
  | "Closest Friends"; // placeholder for later

// the friend profiles displayed on the dashboard represent the friends' most recent updates
// use the shared Friend type imported above
// TODO: id will become the username once we have real data, and we'll also need to add a profile picture URL and maybe other fields

const initialFriends: Friend[] = [
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

function applyFilter(posts: Friend[], filter: FilterOption): Friend[] {
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

  const [friends, setFriends] = useState<Friend[]>(initialFriends);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // we no longer manage profile circle/drowdown state here; it's handled by ProfileMenu

  // Fetch the current user's ID on mount (needed by FriendRequestList and AddFriendModal)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const filteredFriends = useMemo(() => {
    return applyFilter(friends, filterOption);
  }, [friends, filterOption]);

  return (
    <div className="dash-page">
      {/* Top bar */}
      <div className="dash-topbar">
        <div className="dash-title">PASSERBY</div>

        {/* profile button/dropdown moved into its own component */}
        <ProfileMenu />
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

        <button className="dash-add-btn" onClick={() => setModalOpen(true)}>
          Add Friend
        </button>
      </div>

      {/* Incoming friend requests — stacks vertically, pushes feed down */}
      {currentUserId && (
        <FriendRequestList currentUserId={currentUserId} />
      )}

      {/* Feed */}
      <FriendTable friends={filteredFriends} />

      {/* Add Friend modal */}
      {currentUserId && (
        <AddFriendModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
