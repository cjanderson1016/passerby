/*
  File Name: PinnedPostsSection.tsx

  Description:
  Displays the pinned post section on the profile page.
*/

import PostCard from "./PostCard";
import type { ProfilePost } from "./types";

type PinnedPostsSectionProps = {
  post: ProfilePost | null;
  displayName: string;
  username: string;
  isOwnProfile: boolean;
  onOpenMenu: (postId: string) => void;
};

export default function PinnedPostsSection({
  post,
  displayName,
  username,
  isOwnProfile,
  onOpenMenu,
}: PinnedPostsSectionProps) {
  if (!post) {
    return null;
  }

  return (
    <section className="profile-pinned-section">
      <div className="profile-feed-header">
        <h3>Pinned Post</h3>
      </div>

      <PostCard
        post={post}
        displayName={displayName}
        username={username}
        isOwnProfile={isOwnProfile}
        onOpenMenu={onOpenMenu}
      />
    </section>
  );
}