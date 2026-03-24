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

interface OutgoingRequest {
  id: string;
  recipient: {
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

type OutgoingRequestRow = {
  id: string;
  recipient:
    | OutgoingRequest["recipient"]
    | OutgoingRequest["recipient"][]
    | null;
};

export default function FriendRequestList({
  currentUserId,
  onRequestAccepted,
}: FriendRequestListProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>(
    [],
  );

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

  const fetchOutgoingRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("friend_requests")
      .select(
        "id, recipient_id, created_at, recipient:users!recipient_id(username, first_name, last_name)",
      )
      .eq("requester_id", currentUserId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching outgoing friend requests:", error);
      return;
    }

    const parsed: OutgoingRequest[] =
      (data as OutgoingRequestRow[] | null)
        ?.map((row) => ({
          id: row.id,
          recipient: Array.isArray(row.recipient)
            ? row.recipient[0]
            : row.recipient,
        }))
        .filter(
          (row): row is OutgoingRequest =>
            row.recipient !== null && row.recipient !== undefined,
        ) ?? [];

    setOutgoingRequests(parsed);
  }, [currentUserId]);

  useEffect(() => {
    // Subscribe to realtime changes on friend_requests for this user
    const incomingChannel = supabase
      .channel(`friend-requests-incoming:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        () => {
          void fetchRequests();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void fetchRequests();
        }
      });

    const outgoingChannel = supabase
      .channel(`friend-requests-outgoing:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `requester_id=eq.${currentUserId}`,
        },
        () => {
          void fetchOutgoingRequests();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void fetchOutgoingRequests();
        }
      });

    return () => {
      const realtimeState = supabase.realtime.connectionState();

      if (realtimeState === "connecting") {
        void incomingChannel.unsubscribe();
        void outgoingChannel.unsubscribe();
        return;
      }

      void supabase.removeChannel(incomingChannel);
      void supabase.removeChannel(outgoingChannel);
    };
  }, [currentUserId, fetchRequests, fetchOutgoingRequests]);

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

  if (requests.length === 0 && outgoingRequests.length === 0) return null;

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
      {outgoingRequests.map((req) => (
        <div key={req.id} className="fr-card">
          <div className="fr-info">
            <span className="fr-name">
              Friend request to {req.recipient.first_name}{" "}
              {req.recipient.last_name} pending
            </span>
          </div>
          <span className="fr-pending-dot" />
        </div>
      ))}
    </div>
  );
}
