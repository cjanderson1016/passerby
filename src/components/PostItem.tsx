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
    <li style={{ marginBottom: "1rem" }}>
      <div>{post.content}</div>
      <div style={{ fontSize: "0.8rem", color: "#666" }}>{createdAtLabel}</div>
    </li>
  );
}
