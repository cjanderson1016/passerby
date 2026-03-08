import { FaHeart } from "react-icons/fa"; // icon for liked heart (full)
import { FaRegHeart } from "react-icons/fa"; // icon for unliked heart (empty)
import { FaRegCommentDots } from "react-icons/fa6"; // icon for comments

import {useState, useEffect} from "react"
import { getItem, setItem } from "./LocalStorage";
import { supabase } from "../lib/supabase";
import { Replies } from "./replies";
type PostCardProps = {
  id: string;
  name: string;
  username: string;
  content: string;
  createdAt?: string | null;
  pinned?: boolean;
  canManage?: boolean;
  onOpenMenu?: (postId: string) => void;
};
type Comment = {
  id: string;
  user_id: string;
  text: string;
  replies?: Comment[];
  username?: string;
};


export const fetchComments = async (
  postId: string,
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>
) => {
  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id, parent_id, users:users!comments_user_id_fkey1(username)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("error loading comments", error);
    return;
  }

  const commentMap: Record<string, Comment> = {};
  const topComments: Comment[] = [];

  (data || []).forEach((row: any) => {
    const comment: Comment = {
      id: row.id,
      text: row.content,
      username: row.users?.username || "",
      user_id: row.user_id,
      replies: [],
    };
    commentMap[comment.id] = comment;

    if (!row.parent_id) {
      topComments.push(comment);
    } else {
      commentMap[row.parent_id]?.replies?.push(comment);
    }
  });

  setComments(topComments);
};
export default function PostCard({
  id,
  name,
  username,
  content,
  createdAt,
  pinned = false,
  canManage = false,
  onOpenMenu,
}: PostCardProps) {
const storageKey = 'isLiked_' + id;
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    const saved = getItem(storageKey);
    return saved !== undefined ? saved : false;
  });
  const [heartHover, setHeartHover] = useState(false);
  const [commentHover, setCommentHover] = useState(false);
  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString() : "";
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  // keep local storage in sync when isLiked changes. This is temporary 
  useEffect(() => {
    setItem(storageKey, isLiked);
  }, [isLiked, storageKey]);

const handleLikes = () => {
  // toggle state; we'll persist via the effect above
  setIsLiked(prev => !prev);
};

const handleShowComments = () => {
  setShowComments(prev => !prev);
}

useEffect(() => {
  if (!showComments) {
    // clear comments out of memeory when hiding. So that we get fresh data each time
    setComments([]);
    return;
  }

  // fetch comments for this post
  fetchComments(id, setComments);}, [showComments, id]);

const handleAddComment = async () => {
  // don't send an empty comment
  if (!newComment.trim()) {
    console.log("empty comment, not submitting");
    return;
  }
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("User not logged in", userError);
    return;
  }
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: id,
      content: newComment,
      user_id : user.id,
    })
    .select("id, content, user_id, users:users!comments_user_id_fkey1(username)")
    .single();
    
  if (error) {
    console.error("failed to add comment", error);
  } else {
    const CommentArray: Comment = {
    id: data.id,
    user_id: data.user_id,
    text: data.content,
    username: data.users?.[0]?.username || "", // Supabase returns users as array
    replies: [],
  };

    console.log("comment added", data);
    setComments((prev) => [CommentArray, ...prev]);
    setNewComment("");
    fetchComments(id,setComments); // refresh comments to show the new one (including any server-side processing)
  }
}

  return (
    <article
      className={`profile-post-card ${pinned ? "pinned" : ""}`}
      id={`profile-post-${id}`}
    >
      <div className="profile-post-top">
        <div>
          <div className="profile-post-name">{name}</div>
          <div className="profile-post-handle">@{username}</div>
        </div>

        {!pinned && <div className="profile-post-time">{formattedDate}</div>}
      </div>

      <p className="profile-post-content">{content}</p>

      <div className="profile-post-actions">
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
          ></FaHeart>
        )}
      </div>

      <div onClick={handleShowComments}
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
        ></FaRegCommentDots>
      </div>

      {canManage && (
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

    {showComments && (
      <div className="comments-section">
        <div className="add-comment" style={{ padding: "20px" }}>
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

          <button
            className="submit-comment-btn"
            onClick={handleAddComment}
          >
            Post
          </button>
        </div>

          <div className="comment-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment" style={{ padding: "12px 20px", borderTop: "1px solid #eee", maxWidth: "600px" }}>
                <div style={{ fontWeight: "bold" }}>@{comment.username}</div>
                <div style={{ marginTop: "4px" }}>{comment.text}</div>

                {/* Replies */}
                {comment.replies?.map((reply) => (
                  <div key={reply.id} style={{ padding: "8px 20px", marginLeft: "20px", borderLeft: "2px solid #ddd" }}>
                    <div style={{ fontWeight: "bold" }}>@{reply.username}</div>
                    <div>{reply.text}</div>
                  </div>
                ))}

                {/* Reply input box */}
                <Replies
                  parentId={comment.id}
                  postId={id}
                  onReplyAdded={(newReply) => {
                    // update state locally
                    setComments((prev) =>
                      prev.map((c) =>
                        c.id === comment.id ? { ...c, replies: [...(c.replies || []), newReply] } : c
                      )
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
