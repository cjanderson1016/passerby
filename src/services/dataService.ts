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
 * Request presigned URL from Supabase Edge Function
 */
export async function getPresignedUrl(filename: string, contentType: string): Promise<UploadFileResponse> {
  const { data, error } = await supabase.functions.invoke('upload-media', {
    body: { filename, contentType }
  });

  if (error) throw new Error(error.message || "Failed to get presigned URL");

  return data as UploadFileResponse;
}

/**
 * Upload file directly to Cloudflare R2 using presigned URL
 */
export async function uploadFileToR2(file: File): Promise<{ key: string; publicUrl: string }> {
  const filename = `${Date.now()}-${file.name}`;
  const { presignedUrl, key, publicUrl } = await getPresignedUrl(filename, file.type);

  const putRes = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!putRes.ok) throw new Error("Upload failed");

  // Return the key and public URL
  return { key, publicUrl };
}

/**
 * Generate a public URL from the key (assuming R2 bucket is public or uses CDN)
 */
export function getPublicUrl(key: string) {
  // Replace with your Cloudflare public bucket URL
  return `https://<your-r2-subdomain>.r2.dev/${key}`;
}