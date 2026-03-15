/*
  File Name: types.ts

  Description:
  Shared TypeScript types used by profile components.
*/

export type ProfilePost = {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  user_id: string;
  is_pinned: boolean;
  media_key?: string | null; // optional storage key for any media attached to the post, which we can use to generate a URL when displaying the post
  media_content_type?: string | null; // optional content type for the attached media, which we can use to determine how to display the media (e.g. image vs video)
};