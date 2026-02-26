/*
  File Name: Profile.tsx

  Description: Simple placeholder component for a user's profile page.  We'll expand it later.

  Author(s): Connor Anderson
*/

import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// We will need to decide how to load profile pages in the future.
// For now, this just loads the current user's profile based on their session.

type PublicUser = {
  id?: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type Post = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  updated_at: string | null;
};

export default function Profile() {
  // Get the username from the route -- TODO: use this to load other users' profiles, currently we just load the authenticated user's profile regardless of the route param
  const { username: routeUsername } = useParams<{ username: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicUser | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) {
          setError("No authenticated user");
          return;
        }
        // remember for later comparing and posting
        setCurrentUserId(user.id);

        const { data, error } = await supabase
          .from("users")
          .select("id, username, first_name, last_name")
          .eq("id", user.id)
          .single();

        if (error) {
          setError(error.message);
        } else if (mounted) {
          setProfile(data ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName =
    profile && (profile.first_name || profile.last_name)
      ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
      : null;

  const isOwnProfile = currentUserId && profile?.id === currentUserId;

  // fetch posts whenever we know which profile we are viewing
  useEffect(() => {
    if (!profile?.id) return;

    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("id, content, created_at, user_id, updated_at")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("error loading posts", error);
        } else {
          setPosts((data as Post[]) || []);
        }
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, [profile?.id]);

  const handleNewPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !currentUserId) return;
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
    <div
      className="profile-page"
      style={{ padding: "24px", fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {loading ? (
        <h2>Loading profile…</h2>
      ) : error ? (
        <div>
          <h2>Profile</h2>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Shows the first and last name of the user profile and the username from the url (if available) */}
          <h1>
            {displayName ? `Welcome, ${displayName}!` : "Welcome!"}
            {routeUsername && (
              <span style={{ fontWeight: "normal" }}> (@{routeUsername})</span>
            )}
          </h1>
          {/* Shows the username of the user profile */}
          {profile?.username && (
            <p>
              <strong>Username:</strong> @{profile.username}
            </p>
          )}

          {!profile?.username && <p>No username set.</p>}

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
                {posts.map((p) => (
                  <li key={p.id} style={{ marginBottom: "1rem" }}>
                    <div>{p.content}</div>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <Link to="/">← Back to dashboard</Link>
    </div>
  );
}
