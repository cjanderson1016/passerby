/*
  File Name: FriendProfile.tsx

  Description: This component represents an individual friend's profile card on the dashboard feed. 
  It displays the friend's name, their most recent update, how long ago it was posted, and whether there are any unread messages from that friend.

  Future: We add the profile picture and the ability to go to the friend's profile page or messages with that friend.
  
  Author(s): Connor Anderson
*/

import type { Friend } from "../types";

function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

interface FriendProfileProps {
  friend: Friend;
}

export default function FriendProfile({ friend }: FriendProfileProps) {
  return (
    <div className="dash-card">
      <div className="dash-avatar" />

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
