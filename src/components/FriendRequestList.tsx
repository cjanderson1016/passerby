/*
  File Name: FriendRequestList.tsx

  Description: Fetches and displays pending incoming friend requests on the dashboard.
  Subscribes to Supabase Realtime so the list updates live when new requests arrive
  or existing requests are accepted/declined.

  Author(s): Bryson Toubassi
  Contributor(s): Connor Anderson
*/

import { useCallback, useEffect, useState } from "react";
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
  onRequestAccepted?: () => void;
}

type FriendRequestRow = {
  id: string;
  requester: FriendRequest["requester"] | FriendRequest["requester"][] | null;
};

export default function FriendRequestList({
  currentUserId,
  onRequestAccepted,
}: FriendRequestListProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  const fetchRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("friend_requests")
      .select(
        "id, requester_id, created_at, requester:users!requester_id(username, first_name, last_name)",
      )
      .eq("recipient_id", currentUserId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching friend requests:", error);
      return;
    }

    // Supabase join returns requester as an object (or array for some configs)
    const parsed: FriendRequest[] =
      (data as FriendRequestRow[] | null)
        ?.map((row) => ({
          id: row.id,
          requester: Array.isArray(row.requester)
            ? row.requester[0]
            : row.requester,
        }))
        .filter(
          (row): row is FriendRequest =>
            row.requester !== null && row.requester !== undefined,
        ) ?? [];

    setRequests(parsed);
  }, [currentUserId]);

  useEffect(() => {
    // Subscribe to realtime changes on friend_requests for this user
    const channel = supabase
      .channel(`friend-requests-incoming:${currentUserId}`) // we use a unique channel name to avoid conflicts with other subscriptions, but the important part is the filter which ensures we only get events relevant to this user's incoming friend requests
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
          void fetchRequests();
        },
      )
      .subscribe((status) => {
        // Initial load once subscription is ready
        if (status === "SUBSCRIBED") {
          void fetchRequests();
        }
      });

    return () => {
      // Clean up subscription on unmount
      const realtimeState = supabase.realtime.connectionState(); // Check if we're still connecting before trying to unsubscribe, to avoid errors about unsubscribing from a channel that isn't fully set up yet.

      if (realtimeState === "connecting") {
        // If we're still connecting, we can just remove the channel from the Supabase client, which will prevent it from ever being subscribed in the first place and avoid any issues with trying to unsubscribe from a channel that isn't fully set up.
        void channel.unsubscribe();
        return;
      }

      void supabase.removeChannel(channel); // If we're already subscribed, we can safely remove the channel which will unsubscribe us from it and clean up any resources associated with it.
    };
  }, [currentUserId, fetchRequests]);

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
    onRequestAccepted?.();
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
