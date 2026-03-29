export async function fileDigestHex(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  const arr = Array.from(new Uint8Array(hash));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getPublicUrl(key: string) {
  return `${import.meta.env.VITE_R2_PUBLIC_URL?.replace(/\/$/, "") ?? ""}/${encodeURIComponent(key)}`;
}
