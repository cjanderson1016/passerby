/*
    File Name: ProfilePictureUpload.tsx

    Description: UI for uploading and previewing a profile picture.

    Author(s): Connor Anderson
*/

import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";
import { getPublicUrl } from "../services/dataService";

export default function ProfilePictureUpload() {
  const { user } = useUser();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [imagePath, setImagePath] = useState<string | null>(null);

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!user?.id) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_pic_key: filePath })
        .eq("id", user.id);

      if (updateError) {
        console.error("Database update error:", updateError);
        return;
      }

      setImagePath(filePath);
    } finally {
      setUploading(false);
    }
  };

  const imageUrl = imagePath ? getPublicUrl(imagePath) : null;

  return (
    <div className="profile-avatar-upload">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Profile"
          className="profile-avatar"
        />
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
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}