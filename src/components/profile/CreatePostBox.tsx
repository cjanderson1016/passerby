/*
  File Name: CreatePostBox.tsx

  Description:
  Input box for creating a new profile post.
*/

import { useEffect, useMemo, type FormEvent } from "react";

// Accepted media types for post uploads. This is used both for the file input accept attribute and for validating files before upload.
const POST_MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm,.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.webm";

type CreatePostBoxProps = {
  value: string;
  posting: boolean;
  mediaFile: File | null; // the currently selected media file for the post, if any
  onChange: (value: string) => void;
  onMediaChange: (file: File | null) => void; // callback to update the selected media file in the parent component when the user chooses a file or removes it
  onSubmit: (e: FormEvent) => void;
};

export default function CreatePostBox({
  value,
  posting,
  mediaFile, // the currently selected media file for the post, if any
  onChange,
  onMediaChange, // callback to update the selected media file in the parent component when the user chooses a file or removes it
  onSubmit,
}: CreatePostBoxProps) {
  const canSubmit = value.trim().length > 0 || !!mediaFile; // we allow submitting a post if it has text content or if it has a media file, so the user can create a post with just an image/video if they want

  // We use useMemo to create a preview URL for the selected media file, which allows us to show a preview of the image or video before it's uploaded. We also clean up the object URL when the component unmounts or when a new file is selected to prevent memory leaks.
  const mediaPreviewUrl = useMemo(() => {
    if (!mediaFile) return null;
    return URL.createObjectURL(mediaFile);
  }, [mediaFile]);

  // Clean up the object URL when the component unmounts or when a new file is selected to prevent memory leaks
  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
    };
  }, [mediaPreviewUrl]);

  // The handleFileChange function is called when the user selects a file using the file input. It updates the selected media file in the parent component using the onMediaChange callback and resets the file input value to allow selecting the same file again if needed. We also validate the selected file's type and size before allowing it to be set as the mediaFile, showing an alert if it's invalid.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onMediaChange(file);
    e.target.value = "";
  };

  const isVideoPreview = mediaFile?.type.startsWith("video/") ?? false;

  return (
    <section id="create-post-box" className="profile-create-post-card">
      <h3 className="profile-create-post-title">Create a Post</h3>

      <form onSubmit={onSubmit} className="profile-create-post-form">
        <textarea
          className="profile-create-post-textarea"
          placeholder="What's on your mind?"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />

        <div className="profile-create-post-media-row">
          <label className="profile-outline-btn profile-create-post-media-trigger">
            {mediaFile ? "Replace Media" : "Add Photo or Video"}
            <input
              type="file"
              className="profile-create-post-media-input"
              accept={POST_MEDIA_ACCEPT}
              onChange={handleFileChange}
              disabled={posting}
            />
          </label>

          {mediaFile && (
            <>
              <span className="profile-create-post-media-name">
                {mediaFile.name}
              </span>
              <button
                type="button"
                className="profile-outline-btn"
                onClick={() => onMediaChange(null)}
                disabled={posting}
              >
                Remove
              </button>
            </>
          )}
        </div>

        {mediaPreviewUrl && (
          <div className="profile-create-post-preview">
            {isVideoPreview ? (
              <video
                src={mediaPreviewUrl}
                className="profile-create-post-preview-media"
                controls
                preload="metadata"
              />
            ) : (
              <img
                src={mediaPreviewUrl}
                className="profile-create-post-preview-media"
                alt="Selected post media preview"
              />
            )}
          </div>
        )}

        <div className="profile-create-post-actions">
          <button
            type="submit"
            className="profile-primary-btn"
            disabled={posting || !canSubmit}
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </section>
  );
}
