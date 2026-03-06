/*
    File Name: ProfilePictureUpload.tsx

    Description: This component provides a user interface for uploading and previewing a profile picture.

    Author(s): Connor Anderson
*/

// src/components/ProfilePictureUpload.tsx
import { useState, useEffect } from "react";
import { uploadFileToR2, getPublicUrl } from "../services/dataService";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";

// Config: max file size in MB, allowed types
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfilePictureUpload() {
  const { userProfile, setUserProfile, user } = useUser();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load current profile picture (or default avatar)
  useEffect(() => {
    if (userProfile?.profile_pic_key) {
      setPreviewUrl(getPublicUrl(userProfile.profile_pic_key));
    } else {
      setPreviewUrl(null); // will show placeholder
    }
  }, [userProfile?.profile_pic_key]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert("Invalid file type. Only JPG, PNG, or WEBP allowed.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    if (!user || !userProfile?.id) {
      alert("User not loaded. Try again later.");
      return;
    }

    try {
      setUploading(true);

      // Upload file to R2
      const { key, publicUrl } = await uploadFileToR2(file);
      setPreviewUrl(publicUrl);

      // Save the key in Supabase users table
      const { error } = await supabase
        .from("users")
        .update({ profile_pic_key: key })
        .eq("id", userProfile.id);

      if (error) throw error;

      // Update context state
      setUserProfile({ ...userProfile, profile_pic_key: key });
    } catch (err: unknown) {
      console.error("Profile picture upload failed:", err);
      const message = err instanceof Error ? err.message : "Failed to upload profile picture.";
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ margin: "16px 0", textAlign: "center" }}>
      <label htmlFor="profile-pic-upload" style={{ cursor: "pointer" }}>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile"
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #ccc",
            }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: "2px dashed #ccc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#888",
              fontSize: 14,
              background: "#f0f0f0",
            }}
          >
            <span>Upload Avatar</span>
          </div>
        )}
      </label>
      <input
        id="profile-pic-upload"
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
