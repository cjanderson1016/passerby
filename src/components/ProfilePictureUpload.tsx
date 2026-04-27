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
import Modal from "./Modal";
import Button from "./Button";

// We use the same MediaLibraryModal for profile picture uploads to leverage the existing flow for requesting presigned URLs, handling uploads, and finalizing media in the database. This keeps the logic consistent and centralized in the modal and the dataService functions it calls. The ProfilePictureUpload component simply opens the modal and then updates the user's profile with the selected image once it's uploaded and finalized.
type MediaRow = {
  id: string;
  key: string;
  file_name?: string;
  content_type?: string;
  size?: number | null;
};

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

  // When a user selects a photo from the library (which includes newly uploaded photos), we update their profile_pic_key in the database and then update our local state and context to reflect the new profile picture immediately.
  function handleSelectFromLibrary(media: MediaRow | MediaRow[]) {
    // We only expect a single media item for profile picture selection, but the modal could return an array if it was in multi-select mode (which would be wrong in this scenario). We take the first item from the array if it's an array, or just use the media directly if it's a single item. We then update the user's profile_pic_key in the database with the key of the selected media, and update our local state and context to show the new profile picture immediately.
    const m = Array.isArray(media) ? media[0] : media;
    if (!user?.id || !m) return;

    // We use an IIFE here so we can use async/await syntax. We update the user's profile_pic_key in the database with the key of the selected media, and then update our local state and context to show the new profile picture immediately. We also call the onSelected callback prop if it's provided, so that the parent component can react to the new profile picture if needed.
    (async () => {
      try {
        const { error: updateError } = await supabase
          .from("users")
          .update({ profile_pic_key: m.key })
          .eq("id", user.id);
        if (updateError) {
          console.error("Database update error:", updateError);
          return;
        }
        setImagePath(m.key);
        // update central userProfile context so other components (e.g., ProfileMenu) update immediately
        try {
          if (setUserProfile) {
            const newProfile: UserProfile = userProfile
              ? { ...userProfile, profile_pic_key: m.key }
              : {
                  id: user.id,
                  username: "",
                  first_name: null,
                  last_name: null,
                  profile_pic_key: m.key,
                };
            setUserProfile(newProfile);
          }
        } catch (e) {
          console.error("Failed to update user profile context", e);
        }

        if (onSelected) onSelected(m.key);
        setLibraryOpen(false);
      } catch (e) {
        console.error(e);
      }
    })();
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

      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => setLibraryOpen(true)}
      >
        {uploading ? "Processing…" : "Choose Profile Photo"}
      </Button>
      <Modal
        is_open={libraryOpen}
        current_state={setLibraryOpen}
        component={
          <MediaLibraryModal
            open={libraryOpen}
            onClose={() => setLibraryOpen(false)}
            onSelect={handleSelectFromLibrary}
            acceptTypes="images"
            multiSelect={false}
          />
        }
        title={"Media Library"}
      />
      {/* Direct file input removed — uploads must use the media library modal */}
    </div>
  );
}
