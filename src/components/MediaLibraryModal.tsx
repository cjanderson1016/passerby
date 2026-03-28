import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { fileDigestHex } from "../lib/media";
import {
  uploadFileToR2,
  deleteFileFromR2,
  getPublicUrl,
} from "../services/dataService";

type MediaRow = {
  id: string;
  key: string;
  file_name?: string;
  content_type?: string;
  size?: number | null;
};

export default function MediaLibraryModal({
  open,
  onClose,
  onSelect,
  publicUrlBase,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaRow) => void;
  publicUrlBase?: string; // optional base url to render media (prefix + key)
}) {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // edgeFunctionUrl handled in dataService; no local EF_URL needed

  useEffect(() => {
    if (!open) return;
    fetchList();
  }, [open]);

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("user_media")
        .select("id,key,file_name,content_type,size")
        .eq("status", "ready")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data ?? []) as MediaRow[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // use `fileDigestHex` from src/lib/media

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const digest = await fileDigestHex(f);

      // Use dataService to upload; it will handle presign, dedupe, upload and finalize
      await uploadFileToR2(f, { target: "user_media", digest });

      // refresh list
      await fetchList();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setUploading(false);
      (e.target as HTMLInputElement).value = "";
    }
  }

  function previewUrl(key?: string) {
    if (!key) return "";
    if (publicUrlBase)
      return `${publicUrlBase.replace(/\/$/, "")}/${encodeURIComponent(key)}`;
    return getPublicUrl(key);
  }

  return !open ? null : (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0 }}>Media Library</h3>
          <button onClick={onClose}>Close</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <input type="file" onChange={handleFile} />
          {uploading && <div>Uploading…</div>}
          {error && <div style={{ color: "red" }}>{error}</div>}
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div>Loading…</div>
          ) : items.length === 0 ? (
            <div>No media yet.</div>
          ) : (
            <div style={gridStyle}>
              {items.map((m) => (
                <div key={m.id} style={thumbWrapStyle}>
                  {m.content_type?.startsWith("image/") ? (
                    <img
                      src={previewUrl(m.key)}
                      style={thumbStyle}
                      alt={m.file_name ?? "media"}
                    />
                  ) : (
                    <div style={videoPlaceholderStyle}>Video</div>
                  )}
                  <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        onSelect(m);
                        onClose();
                      }}
                    >
                      Select
                    </button>
                    <button
                      onClick={async () => {
                        // copy public url to clipboard
                        const url = previewUrl(m.key);
                        try {
                          await navigator.clipboard.writeText(url);
                        } catch (err: unknown) {
                          console.debug("clipboard copy failed", err);
                        }
                      }}
                    >
                      Copy URL
                    </button>
                    <button
                      onClick={async () => {
                        // delete media via dataService
                        try {
                          await deleteFileFromR2(m.key);
                          await fetchList();
                        } catch (err: unknown) {
                          console.error(err);
                          const msg = err instanceof Error ? err.message : String(err);
                          setError(msg);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};
const modalStyle: React.CSSProperties = {
  width: 760,
  maxHeight: "80%",
  overflow: "auto",
  background: "white",
  padding: 16,
  borderRadius: 8,
};
const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 12,
};
const thumbStyle: React.CSSProperties = {
  width: "100%",
  height: 120,
  objectFit: "cover",
  borderRadius: 6,
};
const thumbWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
};
const videoPlaceholderStyle: React.CSSProperties = {
  width: "100%",
  height: 120,
  background: "#eee",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 6,
};
