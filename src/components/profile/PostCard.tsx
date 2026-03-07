/*
  File Name: PostCard.tsx

  Description:
  Displays a single post on the profile page.
*/

import type { ProfilePost } from "./types";

type PostCardProps = {
  post: ProfilePost;
  displayName: string;
  username: string;
  isOwnProfile: boolean;
  onOpenMenu?: (postId: string) => void;
};

export default function PostCard({
  post,
  displayName,
  username,
  isOwnProfile,
  onOpenMenu,
}: PostCardProps) {
  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString()
    : "";

  return (
    <article
      className={`profile-post-card ${post.is_pinned ? "pinned" : ""}`}
      id={`profile-post-${post.id}`}
    >
      <div className="profile-post-top">
        <div>
          <div className="profile-post-name">{displayName}</div>
          <div className="profile-post-handle">@{username}</div>
        </div>

        {!post.is_pinned && (
          <div className="profile-post-time">{formattedDate}</div>
        )}
      </div>

      {post.is_pinned && (
        <div className="profile-post-pinned-label">📌 Pinned Post</div>
      )}

      <p className="profile-post-content">{post.content}</p>

      <div className="profile-post-actions">
        <button
          type="button"
          className="profile-post-icon-btn"
          aria-label="Like post"
        >
          ♡
        </button>

        <button
          type="button"
          className="profile-post-icon-btn"
          aria-label="Open message or comment"
        >
          💬
        </button>

        {isOwnProfile && (
          <button
            type="button"
            className="profile-post-icon-btn"
            aria-label="More options"
            onClick={() => onOpenMenu?.(post.id)}
          >
            ⋯
          </button>
        )}
      </div>
    </article>
  );
}