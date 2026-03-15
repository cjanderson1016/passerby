/*
  File Name: post_media_columns.sql

  Description:
  Adds optional media metadata columns to posts so each post can reference
  one uploaded image or video in Cloudflare R2.
*/

alter table public.posts
  add column if not exists media_key text,
  add column if not exists media_content_type text;

create index if not exists posts_media_key_idx
  on public.posts (media_key)
  where media_key is not null;
