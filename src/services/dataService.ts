/* 
    File Name: dataService.ts

    Description: This file contains functions for handling file uploads to Cloudflare R2 using 
    presigned URLs obtained from a Supabase Edge Function. 
    It abstracts away the details of requesting a presigned URL and uploading the file, providing 
    a simple interface for components to use when they need to upload media files.

    Author(s): Connor Anderson
*/

import { supabase } from "../lib/supabase";

export type UploadTarget = "profile_photo" | "post_media"; // This type defines the possible targets for uploads, which can be used by the edge function to determine where to store the file and how to generate the key. For example, profile photos might go in a different folder or have different naming conventions than post media. The post_media target also allows for an optional postId to be included in the options when requesting a presigned URL, which can help organize media files by post.

export type GetPresignedUrlOptions = { // This options object can be extended in the future if we need to pass additional information to the edge function when requesting a presigned URL. For now, it includes the target which indicates what the file will be used for (e.g., profile photo or post media), and an optional postId which can be used to associate uploaded media with a specific post if the target is post_media.
  target?: UploadTarget;
  postId?: string;
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

  // Call the edge function to get a presigned URL and key for the file
  const { data, error } = await supabase.functions.invoke("upload-media", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      target,
      postId: options.postId,
      fileName: file.name,
      contentType: file.type,
    },
  });

  // Handle errors from the edge function
  if (error) {
    console.error("Edge function error:", error);
    throw new Error(error.message || "Failed to get presigned URL");
  }

  return data as { uploadUrl: string; key: string }; // Return the presigned URL and key from the edge function. The uploadUrl is used to upload the file directly to R2, and the key is stored in the database to reference the uploaded file later.
}

/**
 * Upload file directly to Cloudflare R2 using a presigned URL
 */
export async function uploadFileToR2(
  file: File, // the file to upload to R2
  options: GetPresignedUrlOptions = {}, // options to pass to the edge function when requesting the presigned URL, such as the target and postId which can help the edge function generate the correct URL and key for the file.
) {
  // Get presigned URL and key from supabase edge function
  const { uploadUrl, key } = await getPresignedUrl(file, options);

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

  // Return the key and the public URL for the uploaded file
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

  return data;
}

/**
 * Generate a public URL from the key (assuming R2 bucket is public or uses CDN)
 */
export function getPublicUrl(key: string) {
  return `${import.meta.env.VITE_R2_PUBLIC_URL}/${key}`;
}