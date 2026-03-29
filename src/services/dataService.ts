/* 
    File Name: dataService.ts

    Description: This file contains functions for handling file uploads to Cloudflare R2 using 
    presigned URLs obtained from a Supabase Edge Function. 
    It abstracts away the details of requesting a presigned URL and uploading the file, providing 
    a simple interface for components to use when they need to upload media files.

    Author(s): Connor Anderson
*/

import { supabase } from "../lib/supabase";

export type UploadTarget = "profile_photo" | "post_media" | "user_media"; // Added `user_media` target for account-scoped media library

export type GetPresignedUrlOptions = { // This options object can be extended in the future if we need to pass additional information to the edge function when requesting a presigned URL. For now, it includes the target which indicates what the file will be used for (e.g., profile photo or post media), and an optional postId which can be used to associate uploaded media with a specific post if the target is post_media.
  target?: UploadTarget;
  postId?: string;
  digest?: string | null; // client-computed digest (hex or base64) for deduplication
};

export interface UploadFileResponse {
  key: string;
  publicUrl: string;
}

/** 
 * Helper function to get the current user's access token for authenticated requests 
*/
async function getAccessToken(): Promise<string> {
  // Get the current session to retrieve the access token
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // Handle errors or missing session
  if (error || !session?.access_token) {
    throw new Error("You must be signed in to upload files");
  }

  return session.access_token; // Return the access token for authenticated requests
}

/**
 * Request presigned URL from Supabase Edge Function
 */
export async function getPresignedUrl(
  file: File, // we pass the file name and content type to the edge function so it can generate an appropriate presigned URL and key for the file. This also allows the edge function to perform any necessary validation or processing based on the file type or name if needed.
  options: GetPresignedUrlOptions = {}, // the options object allows us to specify the target of the upload (e.g., profile photo or post media) and any additional information like postId, which the edge function can use to determine how to generate the presigned URL and key for the file.
) {
  // Get access token for authentication
  const accessToken = await getAccessToken();

  const target = options.target ?? "profile_photo"; // default to profile_photo if no target is specified, but in practice the component calling this function should always specify the target so the edge function can generate the correct key and URL for the file.

  // Enforce a size-based quota for account media. We query the user's current stored size (sum of ready items) and compare.
  const QUOTA_BYTES = Number(import.meta.env.VITE_MEDIA_QUOTA_BYTES ?? (50 * 1024 * 1024)); // default 50MB
  if (target === "user_media") {
    // get current session user (to satisfy RLS) and then ask for sum(size)
    const {
      data: { session },
      error: sessErr,
    } = await supabase.auth.getSession();
    if (sessErr || !session?.user) {
      throw new Error("You must be signed in to upload files");
    }

    // Query sum of sizes for this user's media. RLS should ensure only their rows are returned.
    const { data: sumData, error: sumErr } = await supabase
      .from("user_media")
      .select("sum(size)", { head: false })
      .eq("status", "ready");

    if (sumErr) {
      console.warn("Could not determine current media usage", sumErr);
    }

    // sumData may be like [{ sum: "12345" }] or [{ sum: 12345 }]
    let used = 0;
    if (!sumErr && Array.isArray(sumData) && sumData.length > 0) {
      const first = sumData[0] as Record<string, unknown>;
      const raw = first.sum ?? first.sum_size ?? first[Object.keys(first)[0]];
      if (typeof raw === "string") {
        const parsed = Number(raw);
        used = Number.isFinite(parsed) ? parsed : 0;
      } else if (typeof raw === "number") {
        used = raw;
      } else {
        used = 0;
      }
    }

    if (used + file.size > QUOTA_BYTES) {
      throw new Error(`Media quota exceeded. Available: ${Math.max(0, QUOTA_BYTES - used)} bytes`);
    }
  }

  // Call the edge function to get a presigned URL and key for the file
  // Call the edge function. Pass digest when available so the server can deduplicate without upload.
  const { data, error } = await supabase.functions.invoke("upload-media", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      target,
      postId: options.postId,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      digest: options.digest ?? null,
    },
  });

  // Handle errors from the edge function
  if (error) {
    console.error("Edge function error:", error);
    throw new Error(error.message || "Failed to get presigned URL");
  }

  return data as { uploadUrl?: string; key: string; existing?: boolean; id?: string }; // server may return existing:true to indicate dedupe
}

/**
 * Upload file directly to Cloudflare R2 using a presigned URL
 */
export async function uploadFileToR2(
  file: File, // the file to upload to R2
  options: GetPresignedUrlOptions = {}, // options to pass to the edge function when requesting the presigned URL, such as the target and postId which can help the edge function generate the correct URL and key for the file.
) {
  // Get presigned URL and key from supabase edge function
  const res = await getPresignedUrl(file, options);

  // If the server says this digest already exists for the user, reuse it without uploading
  if (res && res.existing) {
    return {
      key: res.key,
      publicUrl: getPublicUrl(res.key),
    } as UploadFileResponse;
  }

  const uploadUrl = res.uploadUrl;
  const key = res.key;
  if (!uploadUrl) throw new Error("No upload URL returned from server");

  // Upload the file to R2 using the presigned URL
  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  // Handle upload errors
  if (!upload.ok) {
    throw new Error("Upload failed");
  }

  // If the edge function created a pending DB row, finalize it so the server can verify and mark ready
  if (res.id) {
    const accessToken = await getAccessToken();
    const { error: finalizeErr } = await supabase.functions.invoke("upload-media", {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: { action: "finalize", id: res.id },
    });
    if (finalizeErr) {
      console.warn("Finalize error:", finalizeErr);
    }
    // ignore finalize response; the modal/listing will refresh from DB
  }

  return {
    key,
    publicUrl: getPublicUrl(key),
  };
}

/**
 * Delete a file from Cloudflare R2 using a Supabase Edge Function
 */
export async function deleteFileFromR2(key: string) {
  if (!key) {
    throw new Error("Missing file key");
  }

  const accessToken = await getAccessToken();

  const { data, error } = await supabase.functions.invoke("delete-media", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      key,
    },
  });

  if (error) {
    console.error("Delete edge function error:", error);
    throw new Error(error.message || "Failed to delete media from R2");
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }

  // Also mark the DB row as deleted so it no longer appears in the user's library
  try {
    await supabase.from("user_media").update({ status: "deleted" }).eq("key", key);
  } catch (e) {
    // log but don't fail the whole operation if DB cleanup can't run
    console.warn("Failed to mark user_media row deleted", e);
  }

  return data;
}

/**
 * Generate a public URL from the key (assuming R2 bucket is public or uses CDN)
 */
export function getPublicUrl(key: string) {
  return `${import.meta.env.VITE_R2_PUBLIC_URL}/${key}`;
}