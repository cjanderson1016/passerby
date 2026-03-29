/*
  File Name: CreatePostBox.tsx

  Description:
  Input box for creating a new profile post.
*/

import { useState, type FormEvent } from "react";
import MediaLibraryModal from "../MediaLibraryModal";
import { getPublicUrl } from "../../services/dataService";

type MediaRow = {
  id: string;
  key: string;
  file_name?: string;
  content_type?: string;
  size?: number | null;
};

type CreatePostBoxProps = {
  value: string;
  posting: boolean;
  onChange: (value: string) => void;
  // onSubmit receives the event and the selected media attachments (may be empty)
  onSubmit: (e: FormEvent, attachments: MediaRow[]) => Promise<void> | void;
};

export default function CreatePostBox({
  value,
  posting,
  onChange,
  onSubmit,
}: CreatePostBoxProps) {
  const [openLibrary, setOpenLibrary] = useState(false);
  const [attachments, setAttachments] = useState<MediaRow[]>([]);

  const canSubmit = value.trim().length > 0 || attachments.length > 0;

  function handleLibrarySelect(selected: MediaRow | MediaRow[]) {
    const arr = Array.isArray(selected) ? selected : [selected];
    setAttachments((prev) => {
      // preserve existing order and append new selections in the order they were selected
      const existingIds = new Set(prev.map((p) => p.id));
      const toAppend: MediaRow[] = [];
      for (const a of arr) {
        if (!existingIds.has(a.id)) toAppend.push(a);
      }
      return [...prev, ...toAppend];
    });
  }

  function removeAttachment(id: string) {
    setAttachments((s) => s.filter((x) => x.id !== id));
  }

  return (
    <section id="create-post-box" className="profile-create-post-card">
      <h3 className="profile-create-post-title">Create a Post</h3>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await Promise.resolve(onSubmit(e, attachments));
          setAttachments([]);
        }}
        className="profile-create-post-form"
      >
        <textarea
          className="profile-create-post-textarea"
          placeholder="What's on your mind?"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />

        <div className="profile-create-post-media-row">
          <button
            type="button"
            className="profile-outline-btn profile-create-post-media-trigger"
            onClick={() => setOpenLibrary(true)}
            disabled={posting}
          >
            {attachments.length > 0
              ? `Add More (${attachments.length})`
              : "Add Photos or Videos"}
          </button>
        </div>

        {attachments.length > 0 && (
          <div className="profile-create-post-preview-grid">
            {attachments.map((a) => {
              const url = getPublicUrl(a.key);
              const isVideo =
                !!a.content_type && a.content_type.startsWith("video/");
              return (
                <div key={a.id} className="profile-create-post-preview-item">
                  {isVideo ? (
                    <video
                      src={url}
                      className="profile-create-post-preview-media"
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={url}
                      className="profile-create-post-preview-media"
                      alt={a.file_name ?? "attachment"}
                    />
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button
                      type="button"
                      className="profile-outline-btn"
                      onClick={() => removeAttachment(a.id)}
                      disabled={posting}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
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

      <MediaLibraryModal
        open={openLibrary}
        onClose={() => setOpenLibrary(false)}
        onSelect={handleLibrarySelect}
        multiSelect
        acceptTypes="images+videos"
      />
    </section>
  );
}
