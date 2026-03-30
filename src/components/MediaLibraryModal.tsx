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
  multiSelect = false, // if true, allows selecting multiple media items and returns an array; this is useful for post attachments where you may want to select multiple images/videos. If false, selecting an item will immediately call onSelect with that item and close the modal.
  acceptTypes = "images+videos", // can be "images" to only show images and accept image uploads, or "images+videos" to allow both
}: {
  open: boolean;
  onClose: () => void;
  // backwards-compatible: allow single or multiple ([]) selection
  onSelect: (media: MediaRow | MediaRow[]) => void;
  publicUrlBase?: string; // optional base url to render media (prefix + key)
  multiSelect?: boolean;
  acceptTypes?: "images" | "images+videos";
}) {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]); // preserve selection order when multi-selecting

  // When the modal opens, we fetch the user's media from the database. We rely on RLS to ensure they can only see their own media. We also filter to status=ready to only show media that has finished uploading and processing.
  useEffect(() => {
    if (!open) return;
    fetchList();
  }, [open]);

  // Fetch the list of media items for the user. This is called when the modal opens and after a successful upload to refresh the list.
  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      // We select id, key, file_name, content_type and size from user_media where status=ready. RLS should ensure we only get the current user's media.
      const { data, error } = await supabase
        .from("user_media")
        .select("id,key,file_name,content_type,size")
        .eq("status", "ready") // we only want media that is ready to be used, so we filter by status=ready
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data ?? []) as MediaRow[]); // we may get null if there are no items, so we default to an empty array
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // When a file is selected in the file input, we upload it to R2 using the dataService, which handles the entire flow of requesting a presigned URL, uploading the file, and finalizing the media record in the database. After a successful upload, we refresh the media list to show the new item.
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

  // Generate a preview URL for an item. If publicUrlBase is provided, we use that as the base URL; otherwise, we fall back to getPublicUrl which may also use an environment variable or other logic to construct the URL.
  function previewUrl(key?: string) {
    if (!key) return "";
    if (publicUrlBase)
      return `${publicUrlBase.replace(/\/$/, "")}/${encodeURIComponent(key)}`;
    return getPublicUrl(key);
  }

  // Toggle selection of an item by id. Preserve order: selecting appends to the end; deselecting removes it.
  function toggleSelect(id: string) {
    setSelectedOrder((prev) => {
      const exists = prev.indexOf(id);
      if (exists === -1) return [...prev, id];
      const copy = [...prev];
      copy.splice(exists, 1);
      return copy;
    });
  }

  // Clear all selections. Used in multiSelect mode when the user clicks the "Clear" button.
  function clearSelection() {
    setSelectedOrder([]);
  }

  // Get the currently selected items in the order they were selected.
  function selectedItems(): MediaRow[] {
    const idSet = new Set(items.map((i) => i.id));
    return selectedOrder
      .filter((id) => idSet.has(id))
      .map((id) => items.find((i) => i.id === id)!)
      .filter(Boolean);
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
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            type="file"
            onChange={handleFile}
            accept={acceptTypes === "images" ? "image/*" : undefined}
          />
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
              {items
                .filter((m) =>
                  acceptTypes === "images"
                    ? !!m.content_type && m.content_type.startsWith("image/")
                    : true,
                )
                .map((m) => (
                  <div key={m.id} style={thumbWrapStyle}>
                    <div style={{ position: "relative" }}>
                      {m.content_type?.startsWith("image/") ? (
                        <img
                          src={previewUrl(m.key)}
                          style={thumbStyle}
                          alt={m.file_name ?? "media"}
                        />
                      ) : (
                        <div style={videoPlaceholderStyle}>Video</div>
                      )}
                      {multiSelect ? (
                        <label style={checkboxWrap}>
                          <input
                            type="checkbox"
                            checked={selectedOrder.indexOf(m.id) !== -1}
                            onChange={() => toggleSelect(m.id)}
                          />
                        </label>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                      {!multiSelect && (
                        <button
                          onClick={() => {
                            onSelect(m);
                            onClose();
                          }}
                        >
                          Select
                        </button>
                      )}
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
                            // also clear selection for deleted id
                            setSelectedOrder((s) => s.filter((id) => id !== m.id));
                          } catch (err: unknown) {
                            console.error(err);
                            const msg =
                              err instanceof Error ? err.message : String(err);
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
        {multiSelect && (
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                const selected = selectedItems();
                if (selected.length === 0) return onClose();
                onSelect(selected);
                clearSelection();
                onClose();
              }}
            >
              Select {selectedOrder.length}
            </button>
            <button
              onClick={() => {
                clearSelection();
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
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

const checkboxWrap: React.CSSProperties = {
  position: "absolute",
  top: 8,
  right: 8,
  background: "rgba(255,255,255,0.9)",
  padding: 4,
  borderRadius: 4,
};
