import { useState, useEffect } from "react";

import { FaHeart, FaRegHeart } from "react-icons/fa"; // icons for liked/unliked heart
import { FaRegCommentDots } from "react-icons/fa6"; // icon for comments

import { supabase } from "../../lib/supabase";
import { getPublicUrl } from "../../services/dataService";
import { getItem, setItem } from "../LocalStorage";
import { Replies } from "../replies"; // component for handling replies.
import type { ProfilePost } from "./types";

// Type definition for a comment.
type Comment = {
  id: string;
  user_id: string;
  text: string;
  username?: string;
  replies?: Comment[]; // replies are also comments, but nested under a parent comment.
};

type CommentRow = {
  // this type represents the raw comment data we get from the database, which includes the joined user data for the comment's author. We will transform this into our Comment type for use in the UI.
  id: string;
  content: string;
  user_id: string;
  parent_id: string | null;
  users?: { username?: string | null } | { username?: string | null }[] | null;
};

type PostCardProps = {
  post: ProfilePost;
  displayName: string;
  username: string;
  isOwnProfile: boolean;
  onOpenMenu?: (postId: string) => void;
};

/* ---------------- FETCH COMMENTS (When the user makes a new post/reply, automatically update the page) ---------------- */

const fetchComments = async (
  postId: string, // arg1 : The ID of the post for which we want to fetch comments
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>, // arg2: the function to update the comments.
) => {
  // Fetch comments from the database for the given the post ID, including the username of the commenter.
  const { data, error } = await supabase
    .from("comments")
    .select(
      "id, content, created_at, user_id, parent_id, users:users!comments_user_id_fkey1(username)",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  // If there's an error during fetching, just exit and log the error
  if (error) {
    console.error("error loading comments", error);
    return;
  }

  // converts the array of comments into a 2D array where top-level (aka parent) comments are seperated from replies. You cannot make a reply to a reply because all replies are on the same level
  const map: Record<string, Comment> = {}; // This map is used to quickly find comments by their ID when we need to attach replies to their parent comment.
  const top: Comment[] = []; // This array holds the top-level comments (parent-id = null)

  // Loop through each comment in the database and organize them into top-level comments and their replies.
  ((data as CommentRow[] | null) || []).forEach((row) => {
    const joinedUser = Array.isArray(row.users) ? row.users[0] : row.users;

    const c: Comment = {
      id: row.id,
      text: row.content,
      user_id: row.user_id,
      username: joinedUser?.username || "",
      replies: [],
    };

    map[c.id] = c; // add comment to map.

    if (!row.parent_id) {
      top.push(c); // if the comment has no parent, it's a top-level comment, so we add it to the 'top' array.
    } else {
      map[row.parent_id]?.replies?.push(c); // if the comment has a parent, we find its parent in the map and add it to the parent's 'replies' array.
    }
  });

  setComments(top);
};

/* ---------------- THE POST COMPONENT ---------------- */

export default function PostCard({
  post,
  displayName,
  username,
  isOwnProfile,
  onOpenMenu,
}: PostCardProps) {
  const id = post.id;
  const storageKey = "isLiked_" + id; // for now we will store likes on the user's machine in local storage

  // Keep track if a post is liked by using getItem to check local storage.
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    const saved = getItem(storageKey);
    return saved !== undefined ? saved : false;
  });

  // State for storing hover effects on the like and comment icons
  const [heartHover, setHeartHover] = useState(false);
  const [commentHover, setCommentHover] = useState(false);

  // states for comments
  const [comments, setComments] = useState<Comment[]>([]); // stores all of the comments for the post.
  const [showComments, setShowComments] = useState(false); // hides and unhides comments
  const [newComment, setNewComment] = useState(""); // Stores new comment text before it's submitted.

  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString()
    : "";
  const trimmedContent = post.content.trim();
  const mediaUrl = post.media_key ? getPublicUrl(post.media_key) : "";
  const mediaContentType = post.media_content_type?.toLowerCase() ?? "";
  const isVideoMedia =
    mediaContentType.startsWith("video/") ||
    /\.(mp4|mov|webm)$/i.test(post.media_key ?? "");

  /* ---------------- LIKE HANDLING ---------------- */

  useEffect(() => {
    setItem(storageKey, isLiked); // update local storage when the like state chnges
  }, [isLiked, storageKey]);

  const handleLikes = () => {
    setIsLiked((prev) => !prev); // like/unlike
  };

  /* ---------------- HIDE/UNHIDE COMMENTS ---------------- */

  const handleShowComments = () => {
    setShowComments((prev) => {
      if (prev) {
        setComments([]);
      }

      return !prev;
    });
  };

  useEffect(() => {
    if (!showComments) return;

    fetchComments(id, setComments); // show comments
  }, [showComments, id]);

  /* ---------------- ADD COMMENT ---------------- */

  const handleAddComment = async () => {
    if (!newComment.trim()) return; // don't allow empty comments

    // Get the current user so we can associate the comment with them.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // if there's an error getting the user (like  not logged in), log the error and exit.
    if (userError || !user) {
      console.error("User not logged in", userError);
      return;
    }

    // use newComment to insert a new comment into the database
    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: id,
        content: newComment,
        user_id: user.id,
      })
      .select(
        "id, content, user_id, users:users!comments_user_id_fkey1(username)",
      ) // also get the username of the commenter
      .single();

    if (error) {
      console.error("failed to add comment", error);
      return;
    }

    // if the comment was added successfully, create a new Comment object and add it to the comments state to update the UI. We also call fetchComments
    // to refresh the comments from the database, which will include any server-side processing (like counting replies) that we want to reflect in the UI.
    const newC: Comment = {
      id: data.id,
      user_id: data.user_id,
      text: data.content,
      username: data.users?.[0]?.username || "",
      replies: [],
    };

    setComments((prev) => [newC, ...prev]);
    setNewComment("");

    // refresh to rebuild nested structure
    fetchComments(id, setComments);
  };

  return (
    <article
      className={`profile-post-card ${post.is_pinned ? "pinned" : ""}`}
      id={`profile-post-${id}`}
    >
      {/* ---------------- MAIN POST ---------------- */}
      <div className="profile-post-top">
        <div>
          <div className="profile-post-name">{displayName}</div>
          <div className="profile-post-handle">@{username}</div>
        </div>

        {!post.is_pinned && (
          <div className="profile-post-time">{formattedDate}</div>
        )}
      </div>

      {post.is_pinned && (
        <div className="profile-post-pinned-label">📌 Pinned Post</div>
      )}

      {trimmedContent && <p className="profile-post-content">{post.content}</p>}

      {mediaUrl && (
        <div className="profile-post-media-wrap">
          {isVideoMedia ? (
            <video
              className="profile-post-media"
              src={mediaUrl}
              controls
              preload="metadata"
            />
          ) : (
            <img
              className="profile-post-media"
              src={mediaUrl}
              alt={`${displayName}'s post media`}
              loading="lazy"
            />
          )}
        </div>
      )}

      <div className="profile-post-actions">
        {/* LIKE BUTTON */}
        <div
          onMouseEnter={() => setHeartHover(true)}
          onMouseLeave={() => setHeartHover(false)}
          style={{ cursor: "pointer" }}
          onClick={handleLikes}
        >
          {!isLiked ? (
            <FaRegHeart
              style={{
                fontSize: heartHover ? 19 : 18,
                color: heartHover ? "red" : "darkgrey",
                transition: "all 0.1s ease",
              }}
            />
          ) : (
            <FaHeart
              style={{
                fontSize: heartHover ? 19 : 18,
                color: "red",
                transition: "all 0.1s ease",
              }}
            />
          )}
        </div>

        {/* COMMENT BUTTON */}
        <div
          onClick={handleShowComments}
          onMouseEnter={() => setCommentHover(true)}
          onMouseLeave={() => setCommentHover(false)}
          style={{ cursor: "pointer" }}
        >
          <FaRegCommentDots
            style={{
              fontSize: commentHover ? 19 : 18,
              color: commentHover ? "blue" : "darkgrey",
              transition: "all 0.1s ease",
            }}
          />
        </div>

        {isOwnProfile && (
          <button
            type="button"
            className="profile-post-icon-btn"
            aria-label="More options"
            onClick={() => onOpenMenu?.(id)}
          >
            ⋯
          </button>
        )}
      </div>

      {/* ---------------- COMMENTS SECTION ---------------- */}

      {showComments && (
        <div className="comments-section">
          <div
            className="add-comment"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "5px",
            }}
          >
            <textarea
              rows={3}
              style={{
                width: "600px",
                padding: "8px",
                boxSizing: "border-box",
              }}
              placeholder="Add a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />

            <button className="submit-comment-btn" onClick={handleAddComment}>
              Post
            </button>
          </div>

          <div className="comment-list">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="comment"
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid #eee",
                  maxWidth: "600px",
                }}
              >
                <div style={{ fontWeight: "bold" }}>@{comment.username}</div>
                <div style={{ marginTop: "4px" }}>{comment.text}</div>

                {/* Replies */}
                {comment.replies?.map((reply) => (
                  <div
                    key={reply.id}
                    style={{
                      padding: "8px 20px",
                      marginLeft: "20px",
                      borderLeft: "2px solid #ddd",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>@{reply.username}</div>
                    <div>{reply.text}</div>
                  </div>
                ))}

                {/* Reply input */}
                <Replies
                  parentId={comment.id}
                  postId={id}
                  onReplyAdded={(newReply) => {
                    setComments((prev) =>
                      prev.map((c) =>
                        c.id === comment.id
                          ? { ...c, replies: [...(c.replies || []), newReply] }
                          : c,
                      ),
                    );
                  }}
                  fetchComments={() => fetchComments(id, setComments)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
