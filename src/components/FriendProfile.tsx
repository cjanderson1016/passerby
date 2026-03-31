/*
  File Name: FriendProfile.tsx

  Description: This component represents an individual friend's profile card on the dashboard feed. 
  It displays the friend's name, their most recent update, how long ago it was posted, and whether there are any unread messages from that friend.

  Future: We add the profile picture and the ability to go to the friend's profile page or messages with that friend.
  
  Author(s): Connor Anderson
*/

import type { Friend } from "../types";
import { useNavigate } from "react-router-dom";
import { getPublicUrl } from "../services/dataService";

function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

interface FriendProfileProps {
  friend: Friend;
  isActive?: boolean;
  onSelect?: (friend: Friend | null) => void;
}

export default function FriendProfile({
  friend,
  isActive = false,
  onSelect,
}: FriendProfileProps) {
  const navigate = useNavigate();
  const friendAvatarUrl = friend.profile_pic_key
    ? getPublicUrl(friend.profile_pic_key)
    : null;

  const handleClick = () => {
    if (onSelect) {
      onSelect(isActive ? null : friend);
      return;
    }

    navigate(`/profile/${friend.username}`); // fallback for standalone use
  };

  return (
    <div
      className={`dash-card ${isActive ? "dash-card-active" : ""}`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {friendAvatarUrl ? (
        <img
          src={friendAvatarUrl}
          alt={`${friend.name}'s profile`}
          className="dash-avatar"
        />
      ) : (
        <div className="dash-avatar" />
      )}

      <div className="dash-card-main">
        <div className="dash-card-header">
          <div className="dash-name">{friend.name}</div>
          <div className="dash-time">
            {formatMinutes(friend.lastUpdatedMinutesAgo)}
          </div>
        </div>

        <div className="dash-message-box">
          <div className="dash-message">{friend.text}</div>
        </div>
      </div>
    </div>
  );
}
