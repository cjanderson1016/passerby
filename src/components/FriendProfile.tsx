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

  const goToMessages = () => {
    navigate("/messages", {
      state: {
        openFriendId: friend.id,
      },
    }); // navigate to the messages tab and tell it which friend to open
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
        <div className="dash-avatar" />
      )}

      <div className="dash-card-main">
        <div className="dash-card-header">
          <div className="dash-name">{friend.name}</div>

          <div className="dash-card-header-right">
            <div className="dash-time">
              {formatMinutes(friend.lastUpdatedMinutesAgo)}
            </div>

            <div
              className="dash-message-status"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                goToMessages();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  goToMessages();
                }
              }}
            >
              <svg
                viewBox="0 0 48 36"
                className="dash-message-status-icon"
              >
                <path
                  d="M38 2
                     H10
                     Q4 2 4 8
                     V22
                     Q4 28 10 28
                     H28
                     L38 34
                     V28
                     H38
                     Q44 28 44 22
                     V8
                     Q44 2 38 2
                     Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />

                {/* dots */}
                <circle cx="14" cy="15" r="2.5" fill="currentColor" />
                <circle cx="24" cy="15" r="2.5" fill="currentColor" />
                <circle cx="34" cy="15" r="2.5" fill="currentColor" />
              </svg>

              {friend.unreadMessages && <span className="dash-unread-dot" />}
            </div>
          </div>
        </div>

        <div className="dash-message-box">
          <div className="dash-message">{friend.text}</div>
        </div>
      </div>
    </div>
  );
}