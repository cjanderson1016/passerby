/*
    This is the Supabase Edge Function that handles deleting media files from Cloudflare R2. 
    It expects a JSON body with a "key" field that specifies the storage key of the file to delete. 
    The function checks that the user is authenticated and that the key belongs to the user's folder in R2 (e.g., "users/{userId}/...") before allowing the deletion. 
    If the checks pass, it uses the AWS SDK to send a DeleteObjectCommand to R2 to delete the specified file.
*/

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { S3Client, DeleteObjectCommand } from "npm:@aws-sdk/client-s3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
};

function json(
  body: unknown,
  init: ResponseInit & { headers?: HeadersInit } = {},
) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing auth header" }, { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return json({ error: "Unauthorized user" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const key = String(body?.key ?? "").trim();

    if (!key) {
      return json({ error: "Missing key" }, { status: 400 });
    }

    const userPrefix = `users/${data.user.id}/`;
    if (!key.startsWith(userPrefix)) {
      return json({ error: "Not allowed to delete this object" }, { status: 403 });
    }

    const r2 = new S3Client({
      region: "auto",
      endpoint: Deno.env.get("R2_ENDPOINT"),
      credentials: {
        accessKeyId: Deno.env.get("R2_ACCESS_KEY")!,
        secretAccessKey: Deno.env.get("R2_SECRET_KEY")!,
      },
    });

    await r2.send(
      new DeleteObjectCommand({
        Bucket: Deno.env.get("R2_BUCKET"),
        Key: key,
      }),
    );

    return json({ ok: true, key });
  } catch (err) {
    console.error(err);
    return json({ error: "Server error" }, { status: 500 });
  }
});
