/*
  File Name: FriendRequestCard.tsx

  Description: Displays an individual incoming friend request on the dashboard.
  Shows the requester's name and username with Accept and Decline buttons.

  Author(s): Bryson Toubassi
*/

import { useState } from "react";

interface FriendRequestCardProps {
  request: {
    id: string;
    requester: {
      username: string;
      first_name: string;
      last_name: string;
    };
  };
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

export default function FriendRequestCard({
  request,
  onAccept,
  onDecline,
}: FriendRequestCardProps) {
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);

  const handleAccept = async () => {
    setLoading("accept");
    await onAccept(request.id);
    setLoading(null);
  };

  const handleDecline = async () => {
    setLoading("decline");
    await onDecline(request.id);
    setLoading(null);
  };

  const { requester } = request;

  return (
    <div className="fr-card">
      <div className="fr-info">
        <span className="fr-name">
          {requester.first_name} {requester.last_name}
        </span>
        <span className="fr-username">@{requester.username}</span>
      </div>
      <div className="fr-actions">
        <button
          className="fr-accept-btn"
          onClick={handleAccept}
          disabled={loading !== null}
        >
          {loading === "accept" ? "Accepting..." : "Accept"}
        </button>
        <button
          className="fr-decline-btn"
          onClick={handleDecline}
          disabled={loading !== null}
        >
          {loading === "decline" ? "Declining..." : "Decline"}
        </button>
      </div>
    </div>
  );
}
