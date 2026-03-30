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
}

export default function FriendProfile({ friend }: FriendProfileProps) {
  const navigate = useNavigate();
  const friendAvatarUrl = friend.profile_pic_key
    ? getPublicUrl(friend.profile_pic_key)
    : null;

  const goToFriendProfile = () => {
    navigate(`/profile/${friend.username}`); // navigate to the friend's profile page when the card is clicked
  };

  return (
    <div
      className="dash-card"
      role="button"
      tabIndex={0}
      onClick={goToFriendProfile}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") goToFriendProfile(); // navigate to the friend's profile page when Enter or Space is pressed
      }}
    >
      {friendAvatarUrl ? (
        <img
          src={friendAvatarUrl}
          alt={`${friend.name}'s profile`}
          className="dash-avatar"
        />
      ) : (
        <div className="dash-avatar dash-avatar--placeholder">
          <span className="material-icons" aria-hidden>
            person
          </span>
        </div>
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

      <div className="dash-checkwrap">
        <div className="dash-checkbox">
          {friend.unreadMessages && <span className="dash-unread-dot" />}
        </div>
      </div>
    </div>
  );
}
