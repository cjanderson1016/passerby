/*
  File Name: PostItem.tsx

  Description: Displays an individual post in the Activity feed.

  Author(s): Connor Anderson 
*/

import type { Post } from "../types";

interface PostItemProps {
  post: Post;
}

export default function PostItem({ post }: PostItemProps) {
  const createdAtLabel = post.created_at
    ? new Date(post.created_at).toLocaleString()
    : "Unknown date";

  return (
    <li style={{ marginBottom: "1rem", listStyle: "none" }}>
      <div
        className="profile-post-card"
        style={{
          background: "var(--bg-800)",
          color: "var(--text)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--card-shadow)",
          borderRadius: "8px",
          padding: "12px",
        }}
      >
        <div style={{ whiteSpace: "pre-wrap" }}>{post.content}</div>
        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--muted)",
            marginTop: "0.5rem",
          }}
        >
          {createdAtLabel}
        </div>
      </div>
    </li>
  );
}
