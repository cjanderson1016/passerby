/*
  File Name: Dashboard.tsx

  Description: This file defines the main dashboard component for the application.

  Author(s): Connor Anderson, Jacob Richards
  */

import { useEffect, useMemo, useState } from "react";
import "./dashboard.css";
import type { Friend, Post, AcceptedFriendRequest, FriendUser } from "../types";
import ProfileMenu from "../components/ProfileMenu";
import FriendTable from "../components/FriendTable";
import FriendRequestList from "../components/FriendRequestList";
import AddFriendModal from "../components/AddFriendModal";
import { useUser } from "../hooks/useUser";  // hook wraps UserContext and provides user/profile/loading
import { supabase } from "../lib/supabase"; // still used for fetching friends/posts

type FilterOption =
  | "Most Recently Updated"
  | "Alphabetical (A–Z)"
  | "Unread Messages First"
  | "Closest Friends"; // placeholder for later

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

// Helper: safest timestamp picker.  The post only needs to expose
// `created_at`/`updated_at` so we use a partial of the full `Post` type
// instead of resorting to `any`.
function getPostTimestampMs(
  post: Partial<Pick<Post, "updated_at" | "created_at">> | null | undefined,
): number {
  const raw = post?.updated_at ?? post?.created_at;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(t) ? t : Date.now();
}

export default function Dashboard() {
  const [filterOption, setFilterOption] = useState<FilterOption>(
    "Most Recently Updated",
  );

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  // instead of tracking currentUserId in state and querying supabase again,
  // obtain the authenticated user from our UserContext via the useUser hook.
  const { user } = useUser();
  const currentUserId = user?.id ?? null; // derived value used by other effects/components

  // Pull friends + latest posts from Supabase
  useEffect(() => {
    if (!currentUserId) return;

    const fetchFriendsFeed = async () => {
      setLoadingFriends(true);

      // 1) Get accepted relationships involving this user
      const { data: accepted, error: acceptedError } = await supabase
        .from("friend_requests")
        .select("requester_id, recipient_id")
        .eq("status", "accepted")
        .or(
          `requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`,
        );

      if (acceptedError) {
        console.error(
          "Error fetching accepted friends:",
          acceptedError.message,
        );
        setFriends([]);
        setLoadingFriends(false);
        return;
      }

      const friendIds =
        (accepted as AcceptedFriendRequest[] | null)
          ?.map((r) =>
            r.requester_id === currentUserId ? r.recipient_id : r.requester_id,
          )
          .filter(Boolean) ?? [];

      if (friendIds.length === 0) {
        setFriends([]);
        setLoadingFriends(false);
        return;
      }

      // 2) Load friend user profiles
      const { data: friendUsers, error: usersError } = await supabase
        .from("users")
        .select("id, username, first_name, last_name")
        .in("id", friendIds);

      if (usersError) {
        console.error("Error fetching friend users:", usersError.message);
        setFriends([]);
        setLoadingFriends(false);
        return;
      }

      // 3) Load posts for those friends (we'll compute latest per friend in JS)
      const { data: posts, error: postsError } = await supabase
        .from("posts")
        .select("id, user_id, content, created_at, updated_at")
        .in("user_id", friendIds);

      if (postsError) {
        console.error("Error fetching friend posts:", postsError.message);
        // Still show friends even if posts fail
      }

      // Compute the latest post per friend.  We could do this in SQL with window functions, but doing it in JS is simpler for now and we don't expect a large number of friends/posts.
      const latestByUser = new Map<string, Post>();
      for (const p of (posts as Post[] | null) ?? []) {
        const ts = getPostTimestampMs(p);
        const existing = latestByUser.get(p.user_id);
        const existingTs = existing ? getPostTimestampMs(existing) : -1;
        if (!existing || ts > existingTs) latestByUser.set(p.user_id, p);
      }

      const now = Date.now();

      // 4) Build Friend[] for FriendTable
      const feed: Friend[] = ((friendUsers as FriendUser[] | null) ?? []).map(
        (u) => {
          const latest = latestByUser.get(u.id);
          const lastTime = latest ? getPostTimestampMs(latest) : now;
          const minutesAgo = Math.max(0, Math.floor((now - lastTime) / 60000));

          const fullName = [u.first_name, u.last_name]
            .filter(Boolean)
            .join(" ");
          const name = fullName.trim() || u.username || "Unknown";

          return {
            // IMPORTANT: Your router is /profile/:username
            // So friend.id should be the username (not UUID)
            id: u.username ?? u.id,
            name,
            text: latest?.content ?? "(No posts yet)",
            lastUpdatedMinutesAgo: minutesAgo,
            unreadMessages: false, // you can wire this later
          };
        },
      );

      setFriends(feed);
      setLoadingFriends(false);
    };

    void fetchFriendsFeed();
  }, [currentUserId]);

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
      {currentUserId && <FriendRequestList currentUserId={currentUserId} />}

      {/* Feed */}
      {loadingFriends ? (
        <div style={{ padding: "16px" }}>Loading friends…</div>
      ) : friends.length === 0 ? (
        <div style={{ padding: "16px" }}>
          No friends yet. Click <b>Add Friend</b> to send a request.
        </div>
      ) : (
        <FriendTable friends={filteredFriends} />
      )}

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
