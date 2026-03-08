/*
  File Name: PostCountCard.tsx

  Description:
  Displays the total number of posts a user has on their profile.
*/

type PostCountCardProps = {
  postCount: number;
};

export default function PostCountCard({ postCount }: PostCountCardProps) {
  return (
    <section className="profile-side-card profile-post-count-card">
      <h3>Posts</h3>

      <div className="profile-post-count">
        {postCount}
      </div>
    </section>
  );
}
