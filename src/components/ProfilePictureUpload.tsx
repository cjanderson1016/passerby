/*
    File Name: ProfilePictureUpload.tsx

    Description: UI for uploading and previewing a profile picture.

    Author(s): Connor Anderson
*/

import { useState } from "react";
import type { UserProfile } from "../contexts/UserContextData";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";
import { getPublicUrl } from "../services/dataService";
import MediaLibraryModal from "./MediaLibraryModal";

// We accept an optional initialImagePath prop which is the storage key of the user's current profile picture, so we can show it before they upload a new one. This would come from the user's profile data when we fetch it.
type ProfilePictureUploadProps = {
  initialImagePath?: string | null;
  onSelected?: (newImagePath: string) => void;
};

// This component handles the entire flow of choosing a file, validating it, uploading it to R2, and updating the user's profile with the new picture. It also shows a preview of the current or newly uploaded profile picture.
export default function ProfilePictureUpload({
  initialImagePath = null,
  onSelected,
}: ProfilePictureUploadProps) {
  const { user, userProfile, setUserProfile } = useUser();

  const uploading = false;
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  // Uploads for profile photos must go through the MediaLibraryModal. The modal handles
  // presign, dedupe, finalize and then `handleSelectFromLibrary` will set the profile.

  async function handleSelectFromLibrary(media: { id: string; key: string }) {
    if (!user?.id) return;
    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_pic_key: media.key })
        .eq("id", user.id);
      if (updateError) {
        console.error("Database update error:", updateError);
        return;
      }
      setImagePath(media.key);
      // update central userProfile context so other components (e.g., ProfileMenu) update immediately
      try {
        if (setUserProfile) {
          // We create a new user profile object with the updated profile_pic_key. If userProfile is null for some reason, we create a new one with just the id and profile_pic_key (though ideally userProfile should never be null if the user is logged in).
          const newProfile: UserProfile = userProfile
            ? { ...userProfile, profile_pic_key: media.key }
            : {
                id: user.id,
                username: "",
                first_name: null,
                last_name: null,
                profile_pic_key: media.key,
              };
          setUserProfile(newProfile); // this will update the context and cause any components that consume userProfile (like ProfileMenu) to re-render with the new profile picture immediately
        }
      } catch (e) {
        console.error("Failed to update user profile context", e);
      }

      if (onSelected) onSelected(media.key); // callback for parent component to know about the new profile picture (e.g., to update state or trigger other actions)
      setLibraryOpen(false);
    } catch (e) {
      console.error(e);
    }
  }

  // We determine the active image path to show in the preview. If the user has just uploaded a new picture, we use that; otherwise, we fall back to the initial image path from their profile. We then generate the public URL for that image to display it.
  const activeImagePath = imagePath ?? initialImagePath;
  const imageUrl = activeImagePath ? getPublicUrl(activeImagePath) : null;

  return (
    <div className="profile-avatar-upload">
      {imageUrl ? (
        <img src={imageUrl} alt="Profile" className="profile-avatar" />
      ) : (
        <div className="profile-avatar profile-avatar-placeholder">
          No Photo
        </div>
      )}

      <button type="button" onClick={() => setLibraryOpen(true)}>
        {uploading ? "Processing…" : "Choose Profile Photo"}
      </button>

      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={handleSelectFromLibrary}
      />

      {/* Direct file input removed — uploads must use the media library modal */}
    </div>
  );
}
