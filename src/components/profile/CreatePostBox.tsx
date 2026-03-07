/*
  File Name: CreatePostBox.tsx

  Description:
  Input box for creating a new profile post.
*/

import type { FormEvent } from "react";

type CreatePostBoxProps = {
  value: string;
  posting: boolean;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
};

export default function CreatePostBox({
  value,
  posting,
  onChange,
  onSubmit,
}: CreatePostBoxProps) {
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

        <div className="profile-create-post-actions">
          <button
            type="submit"
            className="profile-primary-btn"
            disabled={posting || !value.trim()}
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </section>
  );
}