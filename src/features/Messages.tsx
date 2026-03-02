/*
  File Name: Messages.tsx

  Description: Inbox page that lists all conversations for the current user,
  sorted by most recent activity. Includes a '+' button to start a new
  conversation by picking from the user's friends list.

  Author(s): Bryson Toubassi
*/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";
import ProfileMenu from "../components/ProfileMenu";
import type {
  ConversationPreview,
  FriendUser,
  AcceptedFriendRequest,
} from "../types";
import "./messages.css";

export default function Messages() {
  const { user } = useUser();
  const currentUserId = user?.id ?? null;
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(false);

  // Friend picker state
  const [showPicker, setShowPicker] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [creatingConv, setCreatingConv] = useState<string | null>(null);

  // Fetch conversations for the current user
  useEffect(() => {
    if (!currentUserId) return;

    const fetchConversations = async () => {
      setLoading(true);

      // 1) Get conversation IDs the user participates in
      const { data: participantRows, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      if (partError) {
        console.error("Error fetching conversation participants:", partError);
        setLoading(false);
        return;
      }

      const convIds = (participantRows ?? []).map((r) => r.conversation_id);
      if (convIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 2) Parallel fetch: conversation metadata, other participants, latest messages
      const [convResult, otherResult, msgResult] = await Promise.all([
        supabase
          .from("conversations")
          .select("id, last_message_at")
          .in("id", convIds)
          .order("last_message_at", { ascending: false }),
        supabase
          .from("conversation_participants")
          .select(
            "conversation_id, user_id, user:users!user_id(id, username, first_name, last_name)"
          )
          .in("conversation_id", convIds)
          .neq("user_id", currentUserId),
        supabase
          .from("messages")
          .select("conversation_id, content, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false }),
      ]);

      if (convResult.error) {
        console.error("Error fetching conversations:", convResult.error);
        setLoading(false);
        return;
      }

      // Build a map of other user per conversation
      const otherUserMap = new Map<string, FriendUser>();
      for (const row of (otherResult.data ?? []) as any[]) {
        const u = Array.isArray(row.user) ? row.user[0] : row.user;
        if (u) otherUserMap.set(row.conversation_id, u);
      }

      // Build a map of latest message per conversation
      const latestMsgMap = new Map<string, string>();
      for (const msg of (msgResult.data ?? []) as any[]) {
        if (!latestMsgMap.has(msg.conversation_id)) {
          latestMsgMap.set(msg.conversation_id, msg.content);
        }
      }

      // 3) Assemble ConversationPreview[]
      const previews: ConversationPreview[] = (convResult.data ?? [])
        .map((conv) => {
          const otherUser = otherUserMap.get(conv.id);
          if (!otherUser) return null;
          return {
            conversation_id: conv.id,
            last_message_at: conv.last_message_at,
            other_user: otherUser,
            last_message_content: latestMsgMap.get(conv.id) ?? null,
          };
        })
        .filter(Boolean) as ConversationPreview[];

      setConversations(previews);
      setLoading(false);
    };

    fetchConversations();
  }, [currentUserId]);

  // Fetch friends for the '+' picker
  const openPicker = async () => {
    setShowPicker(true);
    if (friends.length > 0 || !currentUserId) return;

    setLoadingFriends(true);

    // Get accepted friend relationships
    const { data: accepted, error: accError } = await supabase
      .from("friend_requests")
      .select("requester_id, recipient_id")
      .eq("status", "accepted")
      .or(
        `requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`
      );

    if (accError) {
      console.error("Error fetching friends:", accError);
      setLoadingFriends(false);
      return;
    }

    const friendIds = ((accepted as AcceptedFriendRequest[] | null) ?? [])
      .map((r) =>
        r.requester_id === currentUserId ? r.recipient_id : r.requester_id
      )
      .filter(Boolean);

    if (friendIds.length === 0) {
      setFriends([]);
      setLoadingFriends(false);
      return;
    }

    const { data: friendUsers, error: usersError } = await supabase
      .from("users")
      .select("id, username, first_name, last_name")
      .in("id", friendIds);

    if (usersError) {
      console.error("Error fetching friend profiles:", usersError);
      setLoadingFriends(false);
      return;
    }

    setFriends((friendUsers as FriendUser[]) ?? []);
    setLoadingFriends(false);
  };

  // Start or open a conversation with a friend
  const handlePickFriend = async (friendId: string) => {
    setCreatingConv(friendId);
    const { data, error } = await supabase.rpc(
      "get_or_create_direct_conversation",
      { other_user: friendId }
    );

    if (error) {
      console.error("Error creating conversation:", error);
      setCreatingConv(null);
      return;
    }

    setShowPicker(false);
    setCreatingConv(null);
    navigate(`/messages/${data}`);
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const getDisplayName = (u: FriendUser) => {
    const full = [u.first_name, u.last_name].filter(Boolean).join(" ");
    return full.trim() || u.username || "Unknown";
  };

  return (
    <div className="msg-page">
      {/* Top bar — matches Dashboard, with back button */}
      <div className="dash-topbar">
        <button className="msg-back-btn" onClick={() => navigate("/")} title="Back to Dashboard">
          &#8592;
        </button>
        <div className="dash-title">PASSERBY</div>
        <ProfileMenu />
      </div>

      <div className="msg-content">
        <div className="msg-inbox-header">
          <span className="msg-inbox-title">Messages</span>
          <button className="msg-new-btn" onClick={openPicker} title="New conversation">
            +
          </button>
        </div>

        {loading ? (
          <div className="msg-empty">Loading conversations…</div>
        ) : conversations.length === 0 ? (
          <div className="msg-empty">
            No conversations yet. Tap <b>+</b> to message a friend.
          </div>
        ) : (
          <div className="msg-conv-list">
            {conversations.map((conv) => (
              <div
                key={conv.conversation_id}
                className="msg-conv-item"
                onClick={() => navigate(`/messages/${conv.conversation_id}`)}
              >
                <div className="msg-conv-avatar" />
                <div className="msg-conv-info">
                  <div className="msg-conv-name">
                    {getDisplayName(conv.other_user)}
                  </div>
                  <div className="msg-conv-preview">
                    {conv.last_message_content ?? "No messages yet"}
                  </div>
                </div>
                <div className="msg-conv-time">
                  {formatTime(conv.last_message_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Friend picker overlay */}
      {showPicker && (
        <div className="msg-picker-overlay" onClick={() => setShowPicker(false)}>
          <div className="msg-picker" onClick={(e) => e.stopPropagation()}>
            <div className="msg-picker-header">
              <span className="msg-picker-title">New Conversation</span>
              <button
                className="msg-picker-close"
                onClick={() => setShowPicker(false)}
              >
                &times;
              </button>
            </div>
            <div className="msg-picker-body">
              {loadingFriends ? (
                <div className="msg-empty">Loading friends…</div>
              ) : friends.length === 0 ? (
                <div className="msg-empty">No friends yet.</div>
              ) : (
                friends.map((f) => (
                  <button
                    key={f.id}
                    className="msg-friend-item"
                    onClick={() => handlePickFriend(f.id)}
                    disabled={creatingConv === f.id}
                  >
                    <div className="msg-friend-avatar" />
                    <div>
                      <div className="msg-friend-name">
                        {getDisplayName(f)}
                      </div>
                      {f.username && (
                        <div className="msg-friend-username">
                          @{f.username}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
