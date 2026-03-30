/*
  File Name: ProfileHeader.tsx

  Description:
  Header section for the profile page. Displays the user's profile photo,
  name, username, bio, and top action buttons.
*/

import ProfilePictureUpload from "../ProfilePictureUpload";

type ProfileHeaderProps = {
  displayName: string;
  username: string;
  bio?: string | null;
  isOwnProfile: boolean;
  isFriend?: boolean;
  unfriending?: boolean;
  viewedProfilePictureUrl?: string;
  initialImagePath?: string | null;
  onEditBio: () => void;
  onEditProfile: () => void;
  onCreatePostScroll: () => void;
  onProfileImageUploaded?: (newImagePath: string) => void;
  onUnfriend?: () => void;
};

export default function ProfileHeader({
  displayName,
  username,
  bio,
  isOwnProfile,
  isFriend,
  unfriending,
  viewedProfilePictureUrl,
  initialImagePath,
  onEditBio,
  onEditProfile,
  onCreatePostScroll,
  onProfileImageUploaded,
  onUnfriend,
}: ProfileHeaderProps) {
  return (
    <div className="profile-header-card">
      <div className="profile-header-left">
        <div className="profile-avatar-wrap">
          {isOwnProfile ? (
            <ProfilePictureUpload
              initialImagePath={initialImagePath ?? null}
              onSelected={onProfileImageUploaded}
            />
          ) : viewedProfilePictureUrl ? (
            <img
              src={viewedProfilePictureUrl}
              alt={`${displayName}'s profile`}
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar profile-avatar-placeholder">
              <span className="material-icons" aria-hidden>person</span>
            </div>
          )}
        </div>

        <div className="profile-header-text">
          <h1 className="profile-display-name">{displayName}</h1>
          <p className="profile-username">@{username}</p>

          <div className="profile-bio-row">
            <p className="profile-bio-text">
              {bio?.trim() ? bio : "No description yet."}
            </p>

            {isOwnProfile && (
              <button
                type="button"
                className="profile-inline-edit-btn"
                onClick={onEditBio}
                aria-label="Edit description"
                title="Edit description"
              >
                ✏️
              </button>
            )}
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <div className="profile-header-actions">
          <button
            type="button"
            className="profile-outline-btn"
            onClick={onCreatePostScroll}
          >
            Create Post
          </button>

          <button
            type="button"
            className="profile-outline-btn"
            onClick={onEditProfile}
          >
            Edit Profile
          </button>
        </div>
      )}

      {!isOwnProfile && isFriend && onUnfriend && (
        <button
          type="button"
          className="profile-unfriend-btn"
          onClick={onUnfriend}
          disabled={unfriending}
        >
          {unfriending ? "Unfriending..." : "Unfriend"}
        </button>
      )}
    </div>
  );
}