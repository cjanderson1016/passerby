import { useState } from "react";
import { supabase } from "../lib/supabase";
// minimal reply type used for callbacks
export interface Reply {
  id: string;
  user_id: string;
  text: string;
  username?: string;
}

interface RepliesProps {
  parentId: string;
  postId: string;
  onReplyAdded?: (reply: Reply) => void;
  fetchComments?: () => void; // parent can pass a loader callback
}

export function Replies({ parentId, postId, onReplyAdded, fetchComments }: RepliesProps) {
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddReply = async () => {
    if (!replyText.trim()) {
      return;
    }

    setLoading(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User not logged in", userError);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        parent_id: parentId,
        content: replyText,
        user_id: user.id,
      })
      .select("id, content, user_id, users:users!comments_user_id_fkey1(username)")
      .single();

    setLoading(false);

    if (error) {
      console.error("failed to add reply", error);
      return;
    }

    if (data) {
      const newReply: Reply = {
        id: data.id,
        user_id: data.user_id,
        text: data.content,
        username: data.users?.[0]?.username || "",
      };

      setReplyText("");
      onReplyAdded?.(newReply);
      fetchComments?.();
    }
  };

  return (
    <div className="add-reply" style={{ marginTop: "8px" }}>
      <textarea
        rows={2}
        style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
        placeholder="Write a reply…"
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
      />
      <button
        className="submit-reply-btn"
        onClick={handleAddReply}
        disabled={loading}
        style={{ marginTop: "4px" }}
      >
        {loading ? "Posting…" : "Reply"}
      </button>
    </div>
  );
}