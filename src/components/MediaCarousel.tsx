/*
    File Name: MediaCarousel.tsx
    
    Description: A carousel component for displaying multiple media attachments in a post, allowing users to navigate through them.
    
    Author(s): Connor Anderson
*/

import { useState, useEffect } from "react";
import { getPublicUrl } from "../services/dataService";
import "./MediaCarousel.css";

// an attachment has an id, a storage key, and optionally a content type and file name (which we can use for alt text on images).
// The position field is not currently used but could be useful if we want to allow users to reorder attachments in the future.
type Attachment = {
  id: string;
  key: string;
  content_type?: string | null;
  file_name?: string | null;
  status?: string | null;
  position?: number | null;
};

type Props = {
  attachments: Attachment[]; // the list of media attachments to display in the carousel
  // legacy fallback removed — attachments must be provided via `post_media`
  displayName: string; // the display name of the user who made the post, used for alt text on images for accessibility
};

export default function MediaCarousel({ attachments, displayName }: Props) {
  // Create an array of items to display in the carousel. Each item has an id, a URL, a flag indicating if it's a video, and an optional file name.
  // If there are attachments, we use those to create the items array. If there are no attachments but there is a mediaUrl, we create a single item using that mediaUrl. If there are no attachments and no mediaUrl, the items array will be empty.
  const items = attachments.length
    ? attachments.map((a) => ({
        id: a.id,
        url: getPublicUrl(a.key),
        isVideo: !!a.content_type && a.content_type.startsWith("video/"),
        isDeleted: a.status === "deleted",
        fileName: a.file_name,
      }))
    : [];

  const [index, setIndex] = useState(0); // the index of the currently displayed item in the carousel
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(
    null,
  ); // the URL of the image currently being displayed in fullscreen mode, or null if no image is in fullscreen mode

  // Whenever the items array changes (e.g. if the attachments prop changes), we check if the current index is still valid.
  // If the index is greater than or equal to the length of the items array, it means we were on an item that no longer exists (e.g. if attachments were removed), so we reset the index to 0 to show the first item.
  // This ensures that we don't end up with an out-of-bounds index when the attachments change.
  useEffect(() => {
    if (items.length === 0) return;

    if (index >= items.length) {
      const handle = window.setTimeout(() => setIndex(0), 0);
      return () => clearTimeout(handle);
    }
    return undefined;
  }, [items.length, index]);

  // Whenever we enter fullscreen mode for an image (i.e. when fullscreenImageUrl is set), we add an event listener for the Escape key to allow users to exit fullscreen mode by pressing Escape.
  useEffect(() => {
    if (!fullscreenImageUrl) return undefined; // if we don't have a fullscreen image URL, we don't need to add the event listener

    // Create an event listener for the Escape key. Used so if the user presses Escape while an image is in fullscreen mode, we exit fullscreen mode.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreenImageUrl(null);
      }
    };

    window.addEventListener("keydown", onKeyDown); // we add the event listener when we enter fullscreen mode
    return () => window.removeEventListener("keydown", onKeyDown); // we remove the event listener when we exit fullscreen mode or when the component unmounts to avoid memory leaks and unnecessary event handling when we're not in fullscreen mode
  }, [fullscreenImageUrl]);

  // If there are no items to display, we return null and render nothing. This can happen if there are no attachments and no mediaUrl, or if the attachments prop is an empty array.
  if (!items.length) return null;

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length); // go to the previous item, wrapping around to the end if we're at the beginning
  const next = () => setIndex((i) => (i + 1) % items.length); // go to the next item, wrapping around to the beginning if we're at the end

  // We have items to display, so we render the carousel. The carousel consists of a left button, a viewport that shows the current item, a right button, and navigation dots.
  return (
    <div className="media-carousel">
      <button
        className="media-carousel-btn left"
        onClick={prev}
        aria-label="Previous"
      >
        ‹
      </button>

      <div className="media-carousel-viewport">
        {items.map((it, i) => (
          <div
            key={it.id}
            className={`media-carousel-item ${i === index ? "active" : ""}`}
          >
            {it.isDeleted ? (
              <div className="media-carousel-deleted-placeholder">
                This media was deleted.
              </div>
            ) : it.isVideo ? (
              <video
                src={it.url}
                controls
                preload="metadata"
                className="media-carousel-media"
              />
            ) : (
              <button
                type="button"
                className="media-carousel-image-button"
                onClick={() => setFullscreenImageUrl(it.url)}
                aria-label="Open image in full view"
              >
                <img
                  src={it.url}
                  alt={it.fileName ?? `${displayName}'s post media`}
                  className="media-carousel-media"
                  loading="lazy"
                />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        className="media-carousel-btn right"
        onClick={next}
        aria-label="Next"
      >
        ›
      </button>

      <div className="media-carousel-dots">
        {items.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === index ? "active" : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to item ${i + 1}`}
          />
        ))}
      </div>

      {fullscreenImageUrl ? (
        <div
          className="media-carousel-lightbox"
          onClick={() => setFullscreenImageUrl(null)}
          role="presentation"
        >
          <button
            type="button"
            className="media-carousel-lightbox-close"
            onClick={() => setFullscreenImageUrl(null)}
            aria-label="Close full image"
          >
            &times;
          </button>
          <img
            src={fullscreenImageUrl}
            alt="Full size media"
            className="media-carousel-lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
