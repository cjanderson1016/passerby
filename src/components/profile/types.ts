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
  is_pinned?: boolean | null;
};