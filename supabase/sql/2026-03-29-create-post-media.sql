-- Migration: create post_media table to allow multiple attachments per post

CREATE TABLE IF NOT EXISTS public.post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id bigint NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_media_id uuid NOT NULL REFERENCES public.user_media(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional index for ordering
CREATE INDEX IF NOT EXISTS post_media_post_id_position_idx ON public.post_media (post_id, position);

-- RLS: allow owners (post owners) to insert rows via session user check is enforced by server-side post creation flow; keep default open for now

-- Note: Apply this migration in your database (psql or Supabase migration tooling) before deploying the code that inserts into post_media.
