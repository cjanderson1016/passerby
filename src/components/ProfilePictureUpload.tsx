/*
    File Name: ProfilePictureUpload.tsx

    Description: UI for uploading and previewing a profile picture.

    Author(s): Connor Anderson
*/

import { useState, useEffect, useRef } from "react";
import { uploadFileToR2, getPublicUrl } from "../services/dataService";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";

// Constants for file validation (max size and accepted types)
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfilePictureUpload() {
  const { userProfile, setUserProfile, user } = useUser(); // Get user and profile from context

  // State for preview URL and upload status
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null); // Ref to reset file input after upload

  // Load existing profile picture on mount or when userProfile changes
  useEffect(() => {
    if (userProfile?.profile_pic_key) {
      setPreviewUrl(getPublicUrl(userProfile.profile_pic_key)); // Make the public URL from the key and set it as preview
    } else {
      setPreviewUrl(null);
    }
  }, [userProfile?.profile_pic_key]);

  // Handle file selection and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Get the selected file
    if (!file) return; // No file selected, exit early

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert("Invalid file type. Only JPG, PNG, or WEBP allowed.");
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    // Ensure user and profile are loaded before proceeding
    if (!user || !userProfile?.id) {
      alert("User not loaded.");
      return;
    }

    // Proceed with upload
    try {
      setUploading(true); // Set uploading state to disable input and show feedback

      // Optimistic preview (local URL) while uploading to R2
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Upload to R2
      const { key, publicUrl } = await uploadFileToR2(file);

      // Replace preview with CDN/public URL
      setPreviewUrl(publicUrl);

      // Save key in database
      const { error } = await supabase
        .from("users")
        .update({ profile_pic_key: key })
        .eq("id", userProfile.id);

      if (error) throw error;

      // Update context
      setUserProfile({
        ...userProfile,
        profile_pic_key: key,
      });
    } catch (err) {
      // Handle errors and reset preview if upload fails
      console.error("Profile picture upload failed:", err);
      alert("Failed to upload profile picture.");
    } finally {
      setUploading(false);

      // reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div style={{ margin: "16px 0", textAlign: "center" }}>
      <label
        htmlFor="profile-pic-upload"
        style={{ cursor: uploading ? "not-allowed" : "pointer" }}
      >
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
              opacity: uploading ? 0.6 : 1,
              transition: "opacity 0.2s",
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
            Upload Photo
          </div>
        )}
      </label>

      <input
        ref={fileInputRef}
        id="profile-pic-upload"
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={uploading}
      />

      {uploading && (
        <p style={{ fontSize: 14, color: "#666" }}>
          Uploading profile picture...
        </p>
      )}
    </div>
  );
}
