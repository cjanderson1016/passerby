/*
  File Name: Profile.tsx

  Description: Simple placeholder component for a user's profile page.  We'll expand it later.

  Author(s): Connor Anderson, Matthew Eagleman
*/

import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "../hooks/useUser";
import ProfileMenu from "../components/ProfileMenu";
import "./Profile.css";
//import Modal from "../components/Modal";
import { supabase } from "../lib/supabase";
import { deleteFileFromR2, getPublicUrl } from "../services/dataService";
import ProfileHeader from "../components/profile/ProfileHeader";
//import AboutMeCard from "../components/profile/AboutMeCard";
//import InterestsCard from "../components/profile/InterestsCard";
//import PostCountCard from "../components/profile/PostCountCard";
import CreatePostBox from "../components/profile/CreatePostBox";
import PinnedPostsSection from "../components/profile/PinnedPostsSection";
import PostFeed from "../components/profile/PostFeed";
//import RecentPostsPanel from "../components/profile/RecentPostsPanel";
import type { ProfilePost as Post } from "../components/profile/types"; // we define a more specific Post type for the profile page that includes the is_pinned field, since we need that for the pinned posts feature. This way we don't have to use the more general Post type from our global types which doesn't include is_pinned.
import Bulletin from "../components/Bulletin/Bulletin";
import { BulletinProvider } from "../contexts/BulletinContext";

interface ProfileProps {
  embeddedUsername?: string;
  embedded?: boolean;
  onUnfriendSuccess?: () => void;
}

type ViewedProfile = {
  id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_pic_key?: string | null;
  bio?: string | null;
  about_me?: string | null;
  interests?: string[] | null;
  profile_privacy: string;
};

type PostRow = {
  // this is the raw shape of a post row as it comes from the database, which we will then normalize into our Post type that has a guaranteed boolean for is_pinned. We do this because when we fetch from the database, it is possible for the is_pinned field to come back as null if it's not set, but in our application logic we want to treat that as false. By having this intermediate PostRow type, we can handle that normalization in one place.
  id: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  user_id: string;
  is_pinned?: boolean | null; // we make this optional here because when we fetch posts from the database, the is_pinned field might come back as null if it's not set, but we want to treat that as false. In our normalizePost function below, we will convert any null or undefined is_pinned values to false to ensure our Post type always has a boolean for is_pinned.
  // media moved to post_media table; legacy fields removed
};

type EditField = "bio" | "about_me" | "interests" | null;

// We define a set of allowed media types and extensions for post uploads. This is used both for the file input accept attribute and for validating files before upload to ensure users can only upload supported media types for their posts.
// const ALLOWED_POST_MEDIA_TYPES = new Set([
//   "image/jpeg",
//   "image/png",
//   "image/webp",
//   "image/heic",
//   "image/heif",
//   "video/mp4",
//   "video/quicktime",
//   "video/webm",
// ]);

// We also define a set of allowed file extensions as a fallback in case the file type is not provided or is unreliable. This allows us to still validate files based on their extension if needed, while primarily relying on the MIME type for validation.
// const ALLOWED_POST_MEDIA_EXTENSIONS = new Set([
//   "jpg",
//   "jpeg",
//   "png",
//   "webp",
//   "heic",
//   "heif",
//   "mp4",
//   "mov",
//   "webm",
// ]);

// This helper function checks if a given file is an allowed media type for posts by checking both its MIME type and its file extension against our defined sets of allowed types and extensions
// function isAllowedPostMedia(file: File) {
//   // first we check the MIME type of the file against our allowed types. If it matches, we consider it valid and return true.
//   if (ALLOWED_POST_MEDIA_TYPES.has(file.type)) {
//     return true;
//   }
//   // if the MIME type is not in our allowed list, we then check the file extension as a fallback. We extract the extension from the file name, convert it to lowercase, and check if it's in our allowed extensions set. If it matches, we consider it valid and return true. If neither the MIME type nor the extension is allowed, we return false.
//   const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
//   return ALLOWED_POST_MEDIA_EXTENSIONS.has(extension);
// }

function normalizePost(row: PostRow): Post {
  // this function takes a raw PostRow from the database and converts it into our Post type that has a guaranteed boolean for is_pinned. If is_pinned is null or undefined, we treat it as false.
  return {
    ...row,
    is_pinned: row.is_pinned ?? false,
  };
}

export default function Profile({
  embeddedUsername,
  embedded = false,
  onUnfriendSuccess,
}: ProfileProps = {}) {
  const { username: routeUsername } = useParams();
  const username = embeddedUsername ?? routeUsername;
  const navigate = useNavigate();
  const { user } = useUser();

  const [viewedProfile, setViewedProfile] = useState<ViewedProfile | null>(
    null,
  );
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [activeTab, setActiveTab] = useState<"bulletin" | "activity">(
    "bulletin",
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);

  const [editField, setEditField] = useState<EditField>(null);
  const [editValue, setEditValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [isFriend, setIsFriend] = useState(false);
  const [unfriending, setUnfriending] = useState(false);

  const [postMenuPostId, setPostMenuPostId] = useState<string | null>(null);
  const [savingPostAction, setSavingPostAction] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      setLoadingProfile(true);
      setProfileError("");

      try {
        if (!username && !user?.id) {
          if (isActive) {
            setViewedProfile(null);
            setProfileError("No profile found.");
          }
          return;
        }

        if (username) {
          const { data, error } = await supabase
            .from("users")
            .select(
              "id, username, first_name, last_name, profile_pic_key, bio, about_me, interests",
            )
            .eq("username", username)
            .maybeSingle();

          if (error) {
            console.error("Error loading viewed profile:", error);
            if (isActive) setProfileError("Could not load profile.");
            return;
          }

          if (!data) {
            if (isActive) setProfileError("Profile not found.");
            return;
          }

          if (isActive) {
            setViewedProfile(data as ViewedProfile);

            if (user?.id && data.id !== user.id) {
              const { data: friendRow } = await supabase
                .from("friend_requests")
                .select("id")
                .eq("status", "accepted")
                .or(
                  `and(requester_id.eq.${user.id},recipient_id.eq.${data.id}),and(requester_id.eq.${data.id},recipient_id.eq.${user.id})`,
                )
                .maybeSingle();
              if (isActive) setIsFriend(!!friendRow);
            }
          }
        } else if (user?.id) {
          const { data, error } = await supabase
            .from("users")
            .select(
              "id, username, first_name, last_name, profile_pic_key, bio, about_me, interests, profile_privacy",
            )
            .eq("id", user.id)
            .maybeSingle();

          if (error) {
            console.error("Error loading own profile:", error);
            if (isActive) setProfileError("Could not load profile.");
            return;
          }

          if (!data) {
            if (isActive) setProfileError("Profile not found.");
            return;
          }

          if (isActive) {
            setViewedProfile(data as ViewedProfile);
          }
        }
      } finally {
        if (isActive) setLoadingProfile(false);
      }
    };

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [username, user?.id]);

  useEffect(() => {
    if (!viewedProfile?.id) {
      setPosts([]);
      return;
    }

    let isActive = true;

    const loadPosts = async () => {
      setLoadingPosts(true);

      try {
        const { data, error } = await supabase
          .from("posts")
          .select("id, content, created_at, updated_at, user_id, is_pinned")
          .eq("user_id", viewedProfile.id)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading posts:", error);
          if (isActive) setPosts([]);
          return;
        }

        if (isActive) {
          setPosts(
            ((data as PostRow[] | null) ?? []).map((row) => normalizePost(row)),
          );
        }
      } finally {
        if (isActive) setLoadingPosts(false);
      }
    };

    void loadPosts();

    return () => {
      isActive = false;
    };
  }, [viewedProfile?.id]);

  const isOwnProfile =
    !!user?.id && !!viewedProfile?.id && user.id === viewedProfile.id;

  const displayName =
    viewedProfile?.first_name || viewedProfile?.last_name
      ? `${viewedProfile.first_name ?? ""} ${viewedProfile.last_name ?? ""}`.trim()
      : (viewedProfile?.username ?? "");

  const viewedProfilePictureUrl = viewedProfile?.profile_pic_key
    ? getPublicUrl(viewedProfile.profile_pic_key)
    : "";

  // this function is called when the user submits the form to create a new post. It validates the input, creates the post in the database, uploads any attached media to R2, updates the post with the media information, and then updates the local state to show the new post in the feed.
  const handleCreatePost = async (
    e: React.FormEvent,
    attachments: {
      id: string;
      key: string;
      content_type?: string | null;
    }[] = [],
  ) => {
    e.preventDefault();

    const content = newPostContent.trim();
    if ((!content && attachments.length === 0) || !user?.id || !isOwnProfile)
      return;

    setPosting(true);

    try {
      // we trim the content to remove any leading or trailing whitespace before saving it to the database. This helps ensure that we don't end up with posts that are just spaces or have unintended whitespace around them. We also use this trimmed content when creating the post in the database.

      // first we create the post in the database without the media information, since we want to have the post ID generated before we upload the media so that we can associate the media with the post in storage. We set is_pinned to false by default for new posts.
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content,
          is_pinned: false,
        })
        .select("id, content, created_at, updated_at, user_id, is_pinned")
        .single();

      if (error) {
        console.error("Error creating post:", error);
        return;
      }

      if (!data) {
        console.error("Post creation returned no data.");
        return;
      }

      const postToAdd = data as PostRow; // we use the PostRow type here because this is the raw data from the database, which may have is_pinned as null. We will normalize it to our Post type later when we add it to state.

      // if there is a media file attached, we upload it to R2 and then update the post with the media key and content type so we can display it later. We do this after creating the post so that we have a post ID to associate the media with in storage.
      // If attachments were provided from the media library, persist them to `post_media`.
      // Also update the posts row with the first attachment's key for backward-compatible display.
      if (attachments.length > 0) {
        try {
          // Insert post_media rows linking to user_media.id with an explicit position to preserve order
          const rows = attachments.map((a, idx) => ({
            post_id: postToAdd.id,
            user_media_id: a.id,
            position: idx,
          }));

          const { error: insertPmError } = await supabase
            .from("post_media")
            .insert(rows);
          if (insertPmError) {
            console.error("Error inserting post_media rows:", insertPmError);
            alert("Post created, but could not attach all media.");
          }

          // no longer update posts table with media_key; UI reads attachments from post_media
        } catch (uploadError) {
          console.error("Error persisting post media:", uploadError);
          alert("Post created, but attaching media failed.");
        }
      }

      if (postToAdd) {
        setPosts((prev) => [normalizePost(postToAdd), ...prev]);
      }

      setNewPostContent(""); // we clear the new post content state after successfully creating the post
    } finally {
      setPosting(false);
    }
  };

  // this function is called when the user selects a file using the file input in the CreatePostBox component. It updates the selected media file in the parent component using the onMediaChange callback and resets the file input value to allow selecting the same file again if needed. We also validate the selected file's type and size before allowing it to be set as the mediaFile, showing an alert if it's invalid.
  // Note: media selection is now handled by the MediaLibraryModal in CreatePostBox and provided to handleCreatePost as the second argument.

  const openEditModal = (field: EditField) => {
    if (!viewedProfile || !field || !isOwnProfile) return;

    setEditField(field);

    if (field === "bio") {
      setEditValue(viewedProfile.bio ?? "");
    } else if (field === "about_me") {
      setEditValue(viewedProfile.about_me ?? "");
    } else if (field === "interests") {
      setEditValue((viewedProfile.interests ?? []).join(", "));
    }
  };

  const closeEditModal = () => {
    setEditField(null);
    setEditValue("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewedProfile?.id || !editField || !isOwnProfile) return;

    setSavingEdit(true);

    try {
      let updatePayload: Record<string, unknown> = {};

      if (editField === "bio") {
        updatePayload = { bio: editValue.trim() };
      } else if (editField === "about_me") {
        updatePayload = { about_me: editValue.trim() };
      } else if (editField === "interests") {
        const cleaned = editValue
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        updatePayload = { interests: cleaned };
      }

      const { error } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", viewedProfile.id);

      if (error) {
        console.error("Error saving profile edit:", error);
        return;
      }

      setViewedProfile((prev) => {
        if (!prev) return prev;

        if (editField === "bio") {
          return { ...prev, bio: editValue.trim() };
        }

        if (editField === "about_me") {
          return { ...prev, about_me: editValue.trim() };
        }

        if (editField === "interests") {
          return {
            ...prev,
            interests: editValue
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          };
        }

        return prev;
      });

      closeEditModal();
    } finally {
      setSavingEdit(false);
    }
  };

  const openPostMenu = (postId: string) => {
    if (!isOwnProfile) return;
    setPostMenuPostId(postId);
  };

  const closePostMenu = () => {
    setPostMenuPostId(null);
  };

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === postMenuPostId) ?? null,
    [posts, postMenuPostId],
  );

  const handleTogglePinPost = async () => {
    if (!selectedPost || !isOwnProfile) return;

    setSavingPostAction(true);

    try {
      const nextPinnedValue = !selectedPost.is_pinned;

      if (nextPinnedValue) {
        const currentlyPinned = posts.find(
          (post) => post.is_pinned && post.id !== selectedPost.id,
        );

        if (currentlyPinned) {
          const { error: unpinError } = await supabase
            .from("posts")
            .update({ is_pinned: false })
            .eq("id", currentlyPinned.id)
            .eq("user_id", viewedProfile?.id ?? "");

          if (unpinError) {
            console.error("Error unpinning current post:", unpinError);
            return;
          }
        }
      }

      const { error } = await supabase
        .from("posts")
        .update({ is_pinned: nextPinnedValue })
        .eq("id", selectedPost.id)
        .eq("user_id", viewedProfile?.id ?? "");

      if (error) {
        console.error("Error updating pinned post:", error);
        return;
      }

      setPosts((prev) => {
        const updated = prev.map((post) => {
          if (post.id === selectedPost.id) {
            return { ...post, is_pinned: nextPinnedValue };
          }

          if (nextPinnedValue) {
            return { ...post, is_pinned: false };
          }

          return post;
        });

        return [...updated].sort((a, b) => {
          const aPinned = a.is_pinned ? 1 : 0;
          const bPinned = b.is_pinned ? 1 : 0;
          if (bPinned !== aPinned) return bPinned - aPinned;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
      });

      closePostMenu();
    } finally {
      setSavingPostAction(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost || !isOwnProfile) return;

    setSavingPostAction(true);

    try {
      // delete all attachments associated with this post from R2 before deleting the post
      // REVISIT THIS (media should only be deleted through the media library, not by deleting a post, since media can be reused across multiple posts and we don't want to accidentally delete media that's still in use by another post when deleting a post. Instead of deleting media when a post is deleted, we should just disassociate the media from the post in the database, and then provide a way for users to manage their uploaded media separately in the media library where they can see which posts are using each media item and choose to delete media from there if they want to remove it from all posts.)
      try {
        const { data: pmRows, error: pmErr } = await supabase
          .from("post_media")
          .select("user_media (key)")
          .eq("post_id", selectedPost.id);

        if (pmErr) throw pmErr;

        type PostMediaSelectRow = {
          user_media?:
            | { key?: string | null }
            | { key?: string | null }[]
            | null;
        };

        const rows = ((pmRows as PostMediaSelectRow[]) ??
          []) as PostMediaSelectRow[];
        for (const r of rows) {
          const raw = r.user_media;
          const um = Array.isArray(raw) ? raw[0] : raw;
          const key = um?.key;
          if (key) {
            try {
              await deleteFileFromR2(key);
            } catch (deleteMediaError) {
              console.error("Error deleting post media:", deleteMediaError);
              alert("Could not delete post media. Please try again.");
              return;
            }
          }
        }
      } catch (e) {
        console.error("Failed to delete post attachments:", e);
        alert("Could not delete post media. Please try again.");
        return;
      }

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", selectedPost.id)
        .eq("user_id", viewedProfile?.id ?? "");

      if (error) {
        console.error("Error deleting post:", error);
        return;
      }

      setPosts((prev) => prev.filter((post) => post.id !== selectedPost.id));
      closePostMenu();
    } finally {
      setSavingPostAction(false);
    }
  };

  const pinnedPost = posts.find((post) => post.is_pinned) ?? null;
  const feedPosts = posts.filter((post) => !post.is_pinned);
  /*const newestPost =
    [...posts].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0] ?? null;
  const interests = useMemo(
    () => viewedProfile?.interests ?? [],
    [viewedProfile?.interests],
  );*/

  const modalTitle =
    editField === "bio"
      ? "Edit Description"
      : editField === "about_me"
        ? "Edit About Me"
        : editField === "interests"
          ? "Edit Interests"
          : "";

  const modalHelpText =
    editField === "interests"
      ? "Enter interests separated by commas. Example: UI Design, Coding, Gaming"
      : "";

  function EditModal() {
    return (
      <div className="profile-modal-overlay" onClick={closeEditModal}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="profile-modal-header">
            <h3>{modalTitle}</h3>
            <button
              type="button"
              className="exit_btn"
              onClick={closeEditModal}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="profile-modal-form">
            <textarea
              className="profile-modal-textarea"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={editField === "interests" ? 4 : 5}
              placeholder={
                editField === "interests" ? "UI Design, Coding, Gaming" : ""
              }
            />

            {modalHelpText && (
              <p className="profile-modal-help">{modalHelpText}</p>
            )}

            <div className="profile-modal-actions">
              <button
                type="button"
                className="profile-modal-secondary-btn"
                onClick={closeEditModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="profile-modal-primary-btn"
                disabled={savingEdit}
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  const handleUnfriend = async () => {
    if (!viewedProfile?.id || !user?.id || unfriending) return;

    setUnfriending(true);

    try {
      const { error } = await supabase.rpc("unfriend", {
        other_user: viewedProfile.id,
      });

      if (error) {
        console.error("Error unfriending:", error);
        return;
      }

      if (embedded) {
        onUnfriendSuccess?.();
      } else {
        navigate("/");
      }
    } finally {
      setUnfriending(false);
    }
  };

  const scrollToCreatePost = () => {
    document.getElementById("create-post-box")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div className={`profile-page ${embedded ? "profile-page-embedded" : ""}`}>
      {!embedded && (
        <div className="profile-topbar">
          <div className="profile-title">PASSERBY</div>
          <ProfileMenu />
        </div>
      )}

      {loadingProfile ? (
        <p style={{ padding: "16px" }}>Loading profile...</p>
      ) : profileError ? (
        <p style={{ padding: "16px" }}>{profileError}</p>
      ) : viewedProfile ? (
        <div
          className={`profile-shell ${embedded ? "profile-shell-embedded" : ""}`}
        >
          {!embedded && (
            <div className="profile-back-row">
              <Link to="/" className="profile-back-link">
                ← Back to Dashboard
              </Link>
            </div>
          )}

          <div className="profile-card">
            <ProfileHeader
              displayName={displayName}
              username={viewedProfile.username}
              bio={viewedProfile.bio}
              isOwnProfile={isOwnProfile}
              isFriend={isFriend}
              unfriending={unfriending}
              onUnfriend={handleUnfriend}
              viewedProfilePictureUrl={viewedProfilePictureUrl}
              initialImagePath={viewedProfile.profile_pic_key ?? null}
              onEditBio={() => openEditModal("bio")}
              onEditProfile={() => navigate("/settings")}
              onCreatePostScroll={scrollToCreatePost}
              onProfileImageUploaded={(newImagePath) =>
                setViewedProfile((prev) =>
                  prev ? { ...prev, profile_pic_key: newImagePath } : prev,
                )
              }
            />

            <div className="profile-tabs">
              <button
                className={`profile-tab ${activeTab === "bulletin" ? "active" : ""}`}
                onClick={() => setActiveTab("bulletin")}
              >
                Bulletin
              </button>
              <button
                className={`profile-tab ${activeTab === "activity" ? "active" : ""}`}
                onClick={() => setActiveTab("activity")}
              >
                Activity
              </button>
            </div>
            {/*<div className="profile-content-grid">*/}
            {/*<aside className="profile-left-panel">
                      </aside>*/}

            <main className="profile-center-panel">
              {activeTab === "activity" && (
                <>
                  {isOwnProfile && (
                    <CreatePostBox
                      value={newPostContent}
                      posting={posting}
                      onChange={setNewPostContent}
                      onSubmit={handleCreatePost}
                    />
                  )}

                  <PinnedPostsSection
                    post={pinnedPost}
                    displayName={displayName}
                    username={viewedProfile.username}
                    isOwnProfile={isOwnProfile}
                    onOpenMenu={openPostMenu}
                  />

                  <PostFeed
                    loadingPosts={loadingPosts}
                    allPostsCount={posts.length}
                    posts={feedPosts}
                    displayName={displayName}
                    username={viewedProfile.username}
                    isOwnProfile={isOwnProfile}
                    onOpenMenu={openPostMenu}
                  />
                </>
              )}

              {activeTab === "bulletin" && (
                <div className="profile-center-card">
                  {/*
                      <AboutMeCard
                        aboutMe={viewedProfile.about_me}
                        isOwnProfile={isOwnProfile}
                        onEdit={() => openEditModal("about_me")}
                        />

                  <InterestsCard
                    interests={interests}
                    isOwnProfile={isOwnProfile}
                    onEdit={() => openEditModal("interests")}
                  />

                      <RecentPostsPanel
                        newestPost={newestPost}
                        displayName={displayName}
                        username={viewedProfile.username}
                      />
                      <PostCountCard postCount={posts.length} />*/}
                  {/**/}
                  <BulletinProvider>
                    <Bulletin
                      show={true}
                      isOwnProfileInput={isOwnProfile}
                      profileUserId={viewedProfile?.id}
                    />
                  </BulletinProvider>
                </div>
              )}
            </main>

            {/*<aside className="profile-right-panel">
                
                
                
              </aside>*/}
            {/*</div>*/}
          </div>
        </div>
      ) : null}

      {isOwnProfile && editField && <EditModal></EditModal>}

      {isOwnProfile && selectedPost && (
        <div className="profile-modal-overlay" onClick={closePostMenu}>
          <div
            className="profile-modal profile-post-menu-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-modal-header">
              <h3>Post Options</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={closePostMenu}
                aria-label="Close post options"
              >
                ×
              </button>
            </div>

            <div className="profile-post-menu-body">
              <p className="profile-post-menu-preview">
                {selectedPost.content}
              </p>

              <button
                type="button"
                className="profile-post-menu-btn"
                onClick={handleTogglePinPost}
                disabled={savingPostAction}
              >
                {selectedPost.is_pinned ? "Unpin Post" : "Pin Post"}
              </button>

              <button
                type="button"
                className="profile-post-menu-btn profile-post-menu-delete"
                onClick={handleDeletePost}
                disabled={savingPostAction}
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
