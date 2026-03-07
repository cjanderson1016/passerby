/*
  File Name: RecentPostsPanel.tsx

  Description:
  Displays the most recent post in the right-side panel and allows the user
  to jump to that post in the feed.
*/

import type { ProfilePost } from "./types";

type RecentPostsPanelProps = {
  newestPost: ProfilePost | null;
  displayName: string;
  username: string;
};

export default function RecentPostsPanel({
  newestPost,
  displayName,
  username,
}: RecentPostsPanelProps) {
  const handleScrollToPost = () => {
    if (!newestPost) return;

    const postElement = document.getElementById(`profile-post-${newestPost.id}`);
    postElement?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <section className="profile-side-card">
      <div className="profile-side-card-header">
        <h3>Recent Post</h3>
      </div>

      {!newestPost ? (
        <p className="profile-side-card-text">No recent posts yet.</p>
      ) : (
        <button
          type="button"
          className="profile-recent-post-button"
          onClick={handleScrollToPost}
        >
          <div className="profile-recent-post-name">{displayName}</div>
          <div className="profile-recent-post-username">@{username}</div>
          <p className="profile-recent-post-preview">{newestPost.content}</p>
        </button>
      )}
    </section>
  );
}