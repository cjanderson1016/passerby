-- Migration: enable RLS and add policies for post_media

BEGIN;

-- Enable row level security on post_media
ALTER TABLE IF EXISTS public.post_media ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read post_media (attachments) so posts can display their media
CREATE POLICY "Post media: allow select" ON public.post_media
  FOR SELECT
  USING (true);

-- Allow inserting post_media only when the post belongs to the current authenticated user
CREATE POLICY "Post media: allow insert by post owner" ON public.post_media
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_media.post_id
        AND p.user_id = auth.uid()
    )
  );

-- Allow updates only by the post owner
CREATE POLICY "Post media: allow update by post owner" ON public.post_media
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_media.post_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_media.post_id
        AND p.user_id = auth.uid()
    )
  );

-- Allow deletes only by the post owner
CREATE POLICY "Post media: allow delete by post owner" ON public.post_media
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_media.post_id
        AND p.user_id = auth.uid()
    )
  );

COMMIT;
