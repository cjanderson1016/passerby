/*
  File Name: FriendRequestList.tsx

  Description: Fetches and displays pending incoming friend requests on the dashboard.
  Subscribes to Supabase Realtime so the list updates live when new requests arrive
  or existing requests are accepted/declined.

  Author(s): Bryson Toubassi
*/

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import FriendRequestCard from "./FriendRequestCard";

interface FriendRequest {
  id: string;
  requester: {
    username: string;
    first_name: string;
    last_name: string;
  };
}

interface FriendRequestListProps {
  currentUserId: string;
}

export default function FriendRequestList({
  currentUserId,
}: FriendRequestListProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("friend_requests")
      .select(
        "id, requester_id, created_at, requester:users!requester_id(username, first_name, last_name)"
      )
      .eq("recipient_id", currentUserId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching friend requests:", error);
      return;
    }

    // Supabase join returns requester as an object (or array for some configs)
    const parsed: FriendRequest[] = (data ?? []).map((row: any) => ({
      id: row.id,
      requester: Array.isArray(row.requester)
        ? row.requester[0]
        : row.requester,
    }));

    setRequests(parsed);
  };

  useEffect(() => {
    fetchRequests();

    // Subscribe to realtime changes on friend_requests for this user
    const channel = supabase
      .channel("friend-requests-incoming")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        () => {
          // Re-fetch the full list on any change
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const handleAccept = async (requestId: string) => {
    const { error } = await supabase.rpc("accept_friend_request", {
      request_id: requestId,
    });

    if (error) {
      console.error("Error accepting friend request:", error);
      return;
    }

    // Remove from local state immediately for snappy UI
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleDecline = async (requestId: string) => {
    const { error } = await supabase.rpc("decline_friend_request", {
      request_id: requestId,
    });

    if (error) {
      console.error("Error declining friend request:", error);
      return;
    }

    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  if (requests.length === 0) return null;

  return (
    <div className="fr-list">
      <div className="fr-list-title">Friend Requests</div>
      {requests.map((req) => (
        <FriendRequestCard
          key={req.id}
          request={req}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      ))}
    </div>
  );
}
