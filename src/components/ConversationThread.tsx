/*
  File Name: ConversationThread.tsx

  Description: Reusable conversation thread component. Displays messages
  chronologically with chat bubbles (mine on the right, theirs on the left).
  Can be used standalone (embedded=false, shows thread header with back button)
  or embedded inside a split-panel layout (embedded=true, shows compact header).

  Author(s): Bryson Toubassi
*/

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";
import type { Message, FriendUser } from "../types";
import "../features/messages.css";

interface ConversationThreadProps {
  conversationId: string;
  embedded?: boolean;
  onBack?: () => void;
}

export default function ConversationThread({
  conversationId,
  embedded = false,
  onBack,
}: ConversationThreadProps) {
  const { user } = useUser();
  const currentUserId = user?.id ?? null;

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
    <>
      {/* Header: compact embedded version shows just the name; standalone shows back button */}
      {embedded ? (
        <div className="msg-thread-header-embedded">
          {getDisplayName(otherUser)}
        </div>
      ) : (
        <div className="msg-thread-header">
          {onBack && (
            <button className="msg-back-btn" onClick={onBack}>
              &#8592;
            </button>
          )}
          <span className="msg-thread-name">{getDisplayName(otherUser)}</span>
        </div>
      )}

      {/* Messages */}
      <div className="msg-thread-body">
        {loading ? (
          <div className="msg-empty">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="msg-empty">No messages yet. Say hello!</div>
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
    </>
  );
}
