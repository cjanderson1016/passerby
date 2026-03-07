/*
    File Name: ProfilePictureUpload.tsx

    Description: UI for uploading and previewing a profile picture.

    Author(s): Connor Anderson
*/

import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";
import { getPublicUrl, uploadFileToR2 } from "../services/dataService";

// We enforce a max file size of 5 MB for profile pictures to prevent abuse and ensure fast uploads. We also restrict to common image types.
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// We accept an optional initialImagePath prop which is the storage key of the user's current profile picture, so we can show it before they upload a new one. This would come from the user's profile data when we fetch it.
type ProfilePictureUploadProps = {
  initialImagePath?: string | null;
};

// This component handles the entire flow of choosing a file, validating it, uploading it to R2, and updating the user's profile with the new picture. It also shows a preview of the current or newly uploaded profile picture.
export default function ProfilePictureUpload({
  initialImagePath = null,
}: ProfilePictureUploadProps) {
  const { user } = useUser();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [imagePath, setImagePath] = useState<string | null>(null);

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id) return;

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size before attempting upload
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert("Invalid file type. Only JPG, PNG, or WEBP allowed.");
      e.target.value = "";
      return;
    }

    // We check the file size in megabytes and compare to our max. If it's too large, we show an error and don't attempt the upload.
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const { key } = await uploadFileToR2(file); // this function handles uploading the file to R2 and returns the storage key

      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_pic_key: key }) // we store the R2 key in the user's profile so we can retrieve the image later
        .eq("id", user.id);

      if (updateError) {
        console.error("Database update error:", updateError);
        return;
      }

      setImagePath(key); // update the local state to show the new profile picture immediately after upload
      // Optionally, you could also show a success message here or trigger a refetch of the user's profile data if needed.
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload profile picture.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

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

      <button
        type="button"
        className="profile-avatar-upload-btn"
        onClick={handleChooseFile}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload Photo"}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: "none" }}
      />
    </div>
  );
}
