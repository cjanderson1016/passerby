import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
};

type UploadTarget = "profile_photo" | "post_media" | "user_media";

function json(
  body: unknown,
  init: ResponseInit & { headers?: HeadersInit } = {},
) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replaceAll("\\", "-")
    .replaceAll("/", "-")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function extFromFileName(fileName: string) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(fileName);
  return m?.[1]?.toLowerCase() ?? "";
}

function assertAllowedContentType(target: UploadTarget, contentType: string, fileName: string) {
  const isProfile = target === "profile_photo";

  const allowedImage = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
  const allowedVideo = new Set([
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ]);

  if (isProfile) {
    if (!allowedImage.has(contentType)) {
      throw new Error("Invalid contentType for profile photo");
    }
    return;
  }

  if (allowedImage.has(contentType) || allowedVideo.has(contentType)) return;

  const ext = extFromFileName(fileName);
  const okByExt = ["jpg", "jpeg", "png", "webp", "heic", "heif", "mp4", "mov", "webm"].includes(ext);
  if (!okByExt) {
    throw new Error("Invalid contentType for post media");
  }
}

function buildKey(params: {
  userId: string;
  target: UploadTarget;
  postId?: string;
  fileName: string;
}) {
  const safeName = sanitizeFileName(params.fileName);
  const id = crypto.randomUUID();

  if (params.target === "profile_photo") {
    return `users/${params.userId}/profile-photo/${id}-${safeName}`;
  }
  if (params.target === "user_media") {
    return `users/${params.userId}/media/${id}-${safeName}`;
  }

  const postPart = params.postId ? `posts/${params.postId}` : "posts/unassigned";
  return `users/${params.userId}/${postPart}/media/${id}-${safeName}`;
}

const MEDIA_QUOTA_BYTES = Number(Deno.env.get("MEDIA_QUOTA_BYTES") ?? (50 * 1024 * 1024));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth header" }, { status: 401 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return json({ error: "Unauthorized user" }, { status: 401 });

    const user = data.user;
    const body = await req.json().catch(() => ({}));
    const action = body?.action ? String(body.action) : undefined;

    // Finalize uploaded object: verify object exists in R2 and update DB row
    if (action === "finalize") {
      const mediaId = String(body?.id ?? "");
      if (!mediaId) return json({ error: "Missing id" }, { status: 400 });

      const { data: row, error: rowErr } = await supabase
        .from("user_media")
        .select("id,key,user_id")
        .eq("id", mediaId)
        .maybeSingle();

      if (rowErr || !row) return json({ error: "Not found" }, { status: 404 });
      if (row.user_id !== user.id) return json({ error: "Not allowed" }, { status: 403 });

      const r2 = new S3Client({
        region: "auto",
        endpoint: Deno.env.get("R2_ENDPOINT"),
        credentials: {
          accessKeyId: Deno.env.get("R2_ACCESS_KEY")!,
          secretAccessKey: Deno.env.get("R2_SECRET_KEY")!,
        },
      });

      try {
        const head = new HeadObjectCommand({
          Bucket: Deno.env.get("R2_BUCKET"),
          Key: row.key,
        });
        const headResp = await r2.send(head);
        const contentLength = Number(headResp.ContentLength ?? 0);

        // enforce quota on finalize as well
        const { data: sumData } = await supabase
          .from("user_media")
          .select("sum(size)")
          .eq("user_id", user.id)
          .eq("status", "ready")
          .maybeSingle();

        let used = 0;
        if (sumData && typeof sumData === "object") {
          const first = sumData as Record<string, unknown>;
          const raw = first.sum ?? first.sum_size ?? first[Object.keys(first)[0]];
          if (typeof raw === "string") {
            const parsed = Number(raw);
            used = Number.isFinite(parsed) ? parsed : 0;
          } else if (typeof raw === "number") {
            used = raw;
          }
        }

        if (used + contentLength > MEDIA_QUOTA_BYTES) {
          // delete object and mark row deleted
          try {
            const del = new DeleteObjectCommand({ Bucket: Deno.env.get("R2_BUCKET"), Key: row.key });
            await r2.send(del);
          } catch (e) {
            console.error("Failed to delete over-quota object:", e);
          }
          await supabase.from("user_media").update({ status: "deleted" }).eq("id", mediaId);
          return json({ error: "Media quota exceeded on finalize" }, { status: 403 });
        }

        await supabase
          .from("user_media")
          .update({ status: "ready", size: contentLength, uploaded_at: new Date().toISOString() })
          .eq("id", mediaId);

        return json({ ok: true, id: mediaId, size: contentLength });
      } catch (e) {
        console.error(e);
        return json({ error: "Uploaded object not found" }, { status: 404 });
      }
    }

    // Normal upload flow
    const target = (body?.target ?? "profile_photo") as UploadTarget;
    const fileName = String(body?.fileName ?? "");
    const contentType = String(body?.contentType ?? "");
    const postId = body?.postId ? String(body.postId) : undefined;
    const digest = body?.digest ? String(body.digest) : null;
    const sizeProvided = typeof body?.size === "number" ? Number(body.size) : (typeof body?.size === "string" ? Number(body.size) : null);

    if (!fileName || !contentType) {
      return json({ error: "Missing fileName or contentType" }, { status: 400 });
    }
    if (!["profile_photo", "post_media", "user_media"].includes(target)) {
      return json({ error: "Invalid target" }, { status: 400 });
    }

    try {
      assertAllowedContentType(target, contentType, fileName);
    } catch (e) {
      return json({ error: (e as Error).message }, { status: 400 });
    }

    // dedupe by digest
    if (target === "user_media" && digest) {
      const { data: existing } = await supabase
        .from("user_media")
        .select("id,key,status")
        .eq("user_id", user.id)
        .eq("digest", digest)
        .maybeSingle();
      if (existing && existing.status === "ready") {
        return json({ existing: true, id: existing.id, key: existing.key });
      }
    }

    // enforce size-based quota if size provided
    if (target === "user_media" && sizeProvided != null) {
      const { data: sumData } = await supabase
        .from("user_media")
        .select("sum(size)")
        .eq("user_id", user.id)
        .eq("status", "ready")
        .maybeSingle();
      let used = 0;
      if (sumData && typeof sumData === "object") {
        const first = sumData as Record<string, unknown>;
        const raw = first.sum ?? first.sum_size ?? first[Object.keys(first)[0]];
        if (typeof raw === "string") {
          const parsed = Number(raw);
          used = Number.isFinite(parsed) ? parsed : 0;
        } else if (typeof raw === "number") {
          used = raw;
        }
      }
      if (used + sizeProvided > MEDIA_QUOTA_BYTES) {
        return json({ error: "Media quota exceeded" }, { status: 403 });
      }
    }

    const key = buildKey({ userId: user.id, target, postId, fileName });

    let createdId: string | undefined;
    if (target === "user_media") {
      // Try to insert a pending row. If a row with the same digest already exists
      // (for example previously deleted) we update that row to reuse it.
      const insert = await supabase
        .from("user_media")
        .insert({
          user_id: user.id,
          key,
          file_name: fileName,
          content_type: contentType,
          digest,
          status: "pending",
        })
        .select("id")
        .single();

      if (insert.error || !insert.data) {
        // Attempt to recover from unique-constraint by updating existing row with same digest
        if (digest) {
          try {
            const { data: updated } = await supabase
              .from("user_media")
              .update({ key, file_name: fileName, content_type: contentType, status: "pending", uploaded_at: null, size: null })
              .eq("user_id", user.id)
              .eq("digest", digest)
              .select("id")
              .limit(1);

            if (Array.isArray(updated) && updated.length > 0) {
              createdId = (updated[0] as any).id;
            } else if (updated && (updated as any).id) {
              createdId = (updated as any).id;
            } else {
              console.error("insert error and no existing row to update", insert.error);
              return json({ error: "Could not create media row" }, { status: 500 });
            }
          } catch (uErr) {
            console.error("insert error and update failed", insert.error, uErr);
            return json({ error: "Could not create media row" }, { status: 500 });
          }
        } else {
          console.error("insert error", insert.error);
          return json({ error: "Could not create media row" }, { status: 500 });
        }
      } else {
        createdId = insert.data.id;
      }
    }

    const r2 = new S3Client({
      region: "auto",
      endpoint: Deno.env.get("R2_ENDPOINT"),
      credentials: {
        accessKeyId: Deno.env.get("R2_ACCESS_KEY")!,
        secretAccessKey: Deno.env.get("R2_SECRET_KEY")!,
      },
    });

    const command = new PutObjectCommand({
      Bucket: Deno.env.get("R2_BUCKET"),
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

    return json({ uploadUrl, key, id: createdId ?? null });
  } catch (err) {
    console.error(err);
    return json({ error: "Server error" }, { status: 500 });
  }
});
