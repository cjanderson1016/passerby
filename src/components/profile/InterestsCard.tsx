/*
  File Name: InterestsCard.tsx

  Description:
  Displays the user's interests on the profile page.
  Interests are shown as small tag-like elements.
*/

type InterestsCardProps = {
  interests: string[];
  isOwnProfile: boolean;
  onEdit: () => void;
};

export default function InterestsCard({
  interests,
  isOwnProfile,
  onEdit,
}: InterestsCardProps) {
  return (
    <section className="profile-side-card">
      <div className="profile-side-card-header">
        <h3>Interests</h3>

        {isOwnProfile && (
          <button
            type="button"
            className="profile-inline-edit-btn"
            onClick={onEdit}
            aria-label="Edit Interests"
            title="Edit Interests"
          >
            ✏️
          </button>
        )}
      </div>

      {interests.length > 0 ? (
        <div className="profile-interests-list">
          {interests.map((interest, index) => (
            <span key={index} className="profile-interest-tag">
              {interest}
            </span>
          ))}
        </div>
      ) : (
        <p className="profile-side-card-text">
          No interests added yet.
        </p>
      )}
    </section>
  );
}