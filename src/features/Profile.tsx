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
import { supabase } from "../lib/supabase";
import { getPublicUrl } from "../services/dataService";
import ProfileHeader from "../components/profile/ProfileHeader";
import AboutMeCard from "../components/profile/AboutMeCard";
import InterestsCard from "../components/profile/InterestsCard";
//import PostCountCard from "../components/profile/PostCountCard";
import CreatePostBox from "../components/profile/CreatePostBox";
import PinnedPostsSection from "../components/profile/PinnedPostsSection";
import PostFeed from "../components/profile/PostFeed";
import RecentPostsPanel from "../components/profile/RecentPostsPanel";
//import Bulletin from "../components/Bulletin/Bulletin";

type ViewedProfile = {
  id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_pic_key?: string | null;
  bio?: string | null;
  about_me?: string | null;
  interests?: string[] | null;
};

type Post = {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  user_id: string;
  is_pinned?: boolean | null;
};

type EditField = "bio" | "about_me" | "interests" | null;

export default function Profile() {
  const { username } = useParams();
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
          }
        } else if (user?.id) {
          const { data, error } = await supabase
            .from("users")
            .select(
              "id, username, first_name, last_name, profile_pic_key, bio, about_me, interests",
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
          setPosts((data as Post[]) ?? []);
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPostContent.trim() || !user?.id || !isOwnProfile) return;

    setPosting(true);

    try {
      const content = newPostContent.trim();

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

      setPosts((prev) => [data as Post, ...prev]);
      setNewPostContent("");
    } finally {
      setPosting(false);
    }
  };

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
  const newestPost =
    [...posts].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0] ?? null;
  const interests = useMemo(
    () => viewedProfile?.interests ?? [],
    [viewedProfile?.interests],
  );

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

  const scrollToCreatePost = () => {
    document.getElementById("create-post-box")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <div className="profile-title">PASSERBY</div>
        <ProfileMenu />
      </div>

      {loadingProfile ? (
        <p style={{ padding: "16px" }}>Loading profile...</p>
      ) : profileError ? (
        <p style={{ padding: "16px" }}>{profileError}</p>
      ) : viewedProfile ? (
        <div className="profile-shell">
          <div className="profile-back-row">
            <Link to="/" className="profile-back-link">
              ← Back to Dashboard
            </Link>
          </div>

          <div className="profile-card">
            <ProfileHeader
              displayName={displayName}
              username={viewedProfile.username}
              bio={viewedProfile.bio}
              isOwnProfile={isOwnProfile}
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
                      {/*<PostCountCard postCount={posts.length} />*/}
                      
                    
                    {/*<Bulletin show={true} isOwnProfile={isOwnProfile} profileUserId={viewedProfile?.id} />*/}
                  </div>
                )}
              </main>
              
              {/*<aside className="profile-right-panel">
                
                
                
              </aside>*/}
            {/*</div>*/}
          </div>
        </div>
      ) : null}

      {isOwnProfile && editField && (
        <div className="profile-modal-overlay" onClick={closeEditModal}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>{modalTitle}</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={closeEditModal}
                aria-label="Close modal"
              >
                ×
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
      )}

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
