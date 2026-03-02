/*
  File Name: Conversation.tsx

  Description: Thread page for a single conversation. Displays messages
  chronologically with chat bubbles (mine on the right, theirs on the left).
  Uses Supabase Realtime to receive new messages live and the send_message
  RPC to send them.

  Author(s): Bryson Toubassi
*/

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";
import ProfileMenu from "../components/ProfileMenu";
import type { Message, FriendUser } from "../types";
import "./messages.css";

export default function Conversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useUser();
  const currentUserId = user?.id ?? null;
  const navigate = useNavigate();

  const [otherUser, setOtherUser] = useState<FriendUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch the other participant's info
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const fetchOtherUser = async () => {
      const { data, error } = await supabase
        .from("conversation_participants")
        .select(
          "user_id, user:users!user_id(id, username, first_name, last_name)"
        )
        .eq("conversation_id", conversationId)
        .neq("user_id", currentUserId)
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching other participant:", error);
        return;
      }

      const u = Array.isArray((data as any).user)
        ? (data as any).user[0]
        : (data as any).user;
      setOtherUser(u as FriendUser);
    };

    fetchOtherUser();
  }, [conversationId, currentUserId]);

  // Fetch messages and subscribe to Realtime
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages((data as Message[]) ?? []);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates (in case we receive our own message back)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = messageInput.trim();
    if (!body || !conversationId) return;

    setSending(true);
    const { error } = await supabase.rpc("send_message", {
      conv_id: conversationId,
      body,
    });

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setMessageInput("");
    }
    setSending(false);
  };

  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const getDisplayName = (u: FriendUser | null) => {
    if (!u) return "Chat";
    const full = [u.first_name, u.last_name].filter(Boolean).join(" ");
    return full.trim() || u.username || "Unknown";
  };

  return (
    <div className="msg-page">
      {/* Thread header with back button and other user's name */}
      <div className="msg-thread-header">
        <button className="msg-back-btn" onClick={() => navigate("/messages")}>
          &#8592;
        </button>
        <span className="msg-thread-name">{getDisplayName(otherUser)}</span>
        <ProfileMenu />
      </div>

      {/* Messages */}
      <div className="msg-thread-body">
        {loading ? (
          <div className="msg-empty">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="msg-empty">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`msg-bubble ${isMine ? "msg-mine" : "msg-theirs"}`}
              >
                <div>{msg.content}</div>
                <div className="msg-bubble-time">
                  {formatTime(msg.created_at)}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="msg-input-bar">
        <form onSubmit={handleSend}>
          <input
            className="msg-input"
            type="text"
            placeholder="Type a message…"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            disabled={sending}
          />
          <button
            className="msg-send-btn"
            type="submit"
            disabled={sending || !messageInput.trim()}
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
