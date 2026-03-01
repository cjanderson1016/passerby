/*
  File Name: Activity.tsx

  Description: A component that shows posts and activity related to the user. 

  Author(s): Connor Anderson, Matthew Eagleman
*/
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";

type Post = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  updated_at: string | null;
};

interface ActivityProps {
  show: boolean; // whether to show this tab or not, passed from parent
}

export default function Activity(props: ActivityProps) {
  // Get the username from the route -- TODO: use this to load other users' profiles, currently we just load the authenticated user's profile regardless of the route param
  const { user, userProfile } = useUser();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const postsFetchedRef = useRef(false);

  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
    }
  }, [user]);

  const isOwnProfile = currentUserId && userProfile?.id === currentUserId;

  // fetch posts whenever we know which profile we are viewing
  useEffect(() => {
    if (!userProfile?.id) return;
    if (postsFetchedRef.current) return;
    postsFetchedRef.current = true;

    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("id, content, created_at, user_id, updated_at")
          .eq("user_id", userProfile.id)
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
  }, [userProfile?.id]);

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
    <>
      {props.show && (
        <div
          className="activity"
          style={{ padding: "24px", fontFamily: "Arial, Helvetica, sans-serif" }}
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
        </div>
      )}
    </>
  );
}
