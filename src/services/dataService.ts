/* 
    File Name: dataService.ts

    Description: This file contains functions for handling file uploads to Cloudflare R2 using 
    presigned URLs obtained from a Supabase Edge Function. 
    It abstracts away the details of requesting a presigned URL and uploading the file, providing 
    a simple interface for components to use when they need to upload media files.

    Author(s): Connor Anderson
*/

import { supabase } from "../lib/supabase";

export interface UploadFileResponse {
  key: string;
  presignedUrl: string;
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
export async function getPresignedUrl(file: File) {
  // Get access token for authentication
  const accessToken = await getAccessToken();

  // Call the edge function to get a presigned URL and key for the file
  const { data, error } = await supabase.functions.invoke("upload-media", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      fileName: file.name,
      contentType: file.type,
    },
  });

  // Handle errors from the edge function
  if (error) {
    console.error("Edge function error:", error);
    throw new Error("Failed to get presigned URL");
  }

  return data; // Should contain { uploadUrl, key }
}

/**
 * Upload file directly to Cloudflare R2 using a presigned URL
 */
export async function uploadFileToR2(file: File) {
  // Get presigned URL and key from supabase edge function
  const { uploadUrl, key } = await getPresignedUrl(file);

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
 * Generate a public URL from the key (assuming R2 bucket is public or uses CDN)
 */
export function getPublicUrl(key: string) {
  return `${import.meta.env.VITE_R2_PUBLIC_URL}/${key}`;
}