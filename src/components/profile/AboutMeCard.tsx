/*
  File Name: AboutMeCard.tsx

  Description:
  Card component for displaying the user's About Me section
  on the profile page.
*/

type AboutMeCardProps = {
  aboutMe?: string | null;
  isOwnProfile: boolean;
  onEdit: () => void;
};

export default function AboutMeCard({
  aboutMe,
  isOwnProfile,
  onEdit,
}: AboutMeCardProps) {
  return (
    <section className="profile-side-card">
      <div className="profile-side-card-header">
        <h3>About Me</h3>

        {isOwnProfile && (
          <button
            type="button"
            className="profile-inline-edit-btn"
            onClick={onEdit}
            aria-label="Edit About Me"
            title="Edit About Me"
          >
            ✏️
          </button>
        )}
      </div>

      <p className="profile-side-card-text">
        {aboutMe?.trim()
          ? aboutMe
          : "Tell people a little about yourself here."}
      </p>
    </section>
  );
}