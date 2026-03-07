/*
  File Name: PostFeed.tsx

  Description:
  Displays the main list of non-pinned posts on the profile page.
*/

import PostCard from "./PostCard";
import type { ProfilePost } from "./types";

type PostFeedProps = {
  loadingPosts: boolean;
  allPostsCount: number;
  posts: ProfilePost[];
  displayName: string;
  username: string;
  isOwnProfile: boolean;
  onOpenMenu: (postId: string) => void;
};

export default function PostFeed({
  loadingPosts,
  allPostsCount,
  posts,
  displayName,
  username,
  isOwnProfile,
  onOpenMenu,
}: PostFeedProps) {
  if (loadingPosts) {
    return (
      <section className="profile-feed-section">
        <div className="profile-feed-header">
          <h3>Posts</h3>
        </div>

        <div className="profile-feed-empty">Loading posts...</div>
      </section>
    );
  }

  if (allPostsCount === 0) {
    return (
      <section className="profile-feed-section">
        <div className="profile-feed-header">
          <h3>Posts</h3>
        </div>

        <div className="profile-feed-empty">No posts yet.</div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="profile-feed-section">
        <div className="profile-feed-header">
          <h3>Posts</h3>
        </div>

        <div className="profile-feed-empty">
          No regular posts to show right now.
        </div>
      </section>
    );
  }

  return (
    <section className="profile-feed-section">
      <div className="profile-feed-header">
        <h3>Posts</h3>
      </div>

      <div className="profile-feed-list">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            displayName={displayName}
            username={username}
            isOwnProfile={isOwnProfile}
            onOpenMenu={onOpenMenu}
          />
        ))}
      </div>
    </section>
  );
}