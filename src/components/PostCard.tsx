type PostCardProps = {
  id: string;
  name: string;
  username: string;
  content: string;
  createdAt?: string | null;
  pinned?: boolean;
  canManage?: boolean;
  onOpenMenu?: (postId: string) => void;
};

export default function PostCard({
  id,
  name,
  username,
  content,
  createdAt,
  pinned = false,
  canManage = false,
  onOpenMenu,
}: PostCardProps) {
  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString() : "";

  return (
    <article
      className={`profile-post-card ${pinned ? "pinned" : ""}`}
      id={`profile-post-${id}`}
    >
      <div className="profile-post-top">
        <div>
          <div className="profile-post-name">{name}</div>
          <div className="profile-post-handle">@{username}</div>
        </div>

        {!pinned && <div className="profile-post-time">{formattedDate}</div>}
      </div>

      <p className="profile-post-content">{content}</p>

      <div className="profile-post-actions">
        <button type="button" className="profile-post-icon-btn" aria-label="Like post">
          ♡
        </button>

        <button
          type="button"
          className="profile-post-icon-btn"
          aria-label="Open message or comment"
        >
          💬
        </button>

        {canManage && (
          <button
            type="button"
            className="profile-post-icon-btn"
            aria-label="More options"
            onClick={() => onOpenMenu?.(id)}
          >
            ⋯
          </button>
        )}
      </div>
    </article>
  );
}