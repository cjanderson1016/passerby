-- Migration: drop legacy posts.media_key and posts.media_content_type columns

BEGIN;

-- Drop index on posts.media_key if it exists
DROP INDEX IF EXISTS public.posts_media_key_idx;

-- Drop the legacy columns if they exist
ALTER TABLE IF EXISTS public.posts
  DROP COLUMN IF EXISTS media_key,
  DROP COLUMN IF EXISTS media_content_type;

COMMIT;
