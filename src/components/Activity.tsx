/*
  File Name: Activity.tsx

  Description: A component that shows posts and activity related to the user. 

  Author(s): Connor Anderson, Matthew Eagleman
*/
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";
import type { Post } from "../types";
import PostItem from "./PostItem";

interface ActivityProps {
  show: boolean; // whether to show this tab or not, passed from parent
  profileUserId: string | null; // the user ID of the profile we are viewing, used to fetch the correct posts
  isOwnProfile: boolean; // whether the profile being viewed belongs to the current user
}

export default function Activity({
  show,
  profileUserId,
  isOwnProfile,
}: ActivityProps) {
  const { user } = useUser();

  const currentUserId = user?.id ?? null;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);

  // fetch posts whenever we know which profile we are viewing
  useEffect(() => {
    // if we don't have a profile user ID, we can't load any posts
    if (!profileUserId) {
      setPosts([]);
      return;
    }

    // we use a flag and check it in the async function to prevent setting state on an unmounted component
    let isActive = true;

    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("id, content, created_at, user_id, updated_at")
          .eq("user_id", profileUserId) // filter to just this user's posts
          .order("created_at", { ascending: false });

        if (error) {
          console.error("error loading posts", error);
        } else {
          if (isActive) {
            // only set state if the component is still mounted
            setPosts((data as Post[]) || []);
          }
        }
      } finally {
        if (isActive) {
          // only set state if the component is still mounted
          setLoadingPosts(false);
        }
      }
    };

    void loadPosts(); // we call the async function but don't await it since useEffect can't be async

    return () => {
      isActive = false;
    };
  }, [profileUserId]);

  // if we switch to viewing a different profile, reset the new post form state
  useEffect(() => {
    if (!isOwnProfile) {
      setShowNewPostForm(false);
      setNewPostContent("");
    }
  }, [isOwnProfile]);

  // handle submitting a new post. We do an optimistic update to show the new post immediately, but later we might want to refetch the posts list instead to ensure we have the correct data like a real app (e.g. generated ID).
  const handleNewPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !currentUserId || !isOwnProfile) return; // basic validation: no empty posts, must be logged in, and can only post on own profile
    setPosting(true);
    try {
      const { error } = await supabase.from("posts").insert({
        content: newPostContent.trim(),
        user_id: currentUserId,
      });
      if (error) {
        console.error("error creating post", error);
      } else {
        // refresh posts list
        setPosts((prev) => [
          {
            id: "", // placeholder; we could refetch instead if id needed
            content: newPostContent.trim(),
            created_at: new Date().toISOString(),
            user_id: currentUserId,
            updated_at: null,
          },
          ...prev,
        ]);
        setNewPostContent("");
        setShowNewPostForm(false);
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      {show && (
        <div
          className="activity"
          style={{
            padding: "24px",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          {/* if this is the current user's profile, allow posting */}
          {isOwnProfile && (
            <div style={{ marginTop: "1.5rem" }}>
              {!showNewPostForm ? (
                <button
                  onClick={() => setShowNewPostForm(true)}
                  style={{ padding: "0.5rem 1rem" }}
                >
                  New Post
                </button>
              ) : (
                <form onSubmit={handleNewPost}>
                  <div>
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={4}
                      style={{ width: "100%" }}
                      required
                    />
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    <button
                      type="submit"
                      disabled={posting}
                      style={{ padding: "0.5rem 1rem" }}
                    >
                      {posting ? "Posting…" : "Post"}
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() => setShowNewPostForm(false)}
                      disabled={posting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* display any posts belonging to this profile */}
          <div style={{ marginTop: "2rem" }}>
            <h3>Posts</h3>
            {loadingPosts ? (
              <p>Loading posts…</p>
            ) : posts.length === 0 ? (
              <p>No posts yet.</p>
            ) : (
              <ul>
                {posts.map((post) => (
                  <PostItem key={post.id} post={post} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
