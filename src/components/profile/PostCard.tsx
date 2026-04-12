import { useState, useEffect } from "react";
import "./PostCard.css"

import { FaHeart, FaRegHeart } from "react-icons/fa"; // icons for liked/unliked heart
import { FaRegCommentDots } from "react-icons/fa6"; // icon for comments

import { supabase } from "../../lib/supabase";
import { getPublicUrl } from "../../services/dataService";
import { getItem, setItem } from "../LocalStorage";
import { Replies } from "../replies"; // component for handling replies.
import type { ProfilePost } from "./types";
import Button from "../Button";
// Type definition for a comment.
type Comment = {
  id: string;
  user_id: string;
  text: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  profile_pic_key?: string
  replies?: Comment[]; // replies are also comments, but nested under a parent comment.
};


type CommentRow = {
  // this type represents the raw comment data we get from the database, which includes the joined user data for the comment's author. We will transform this into our Comment type for use in the UI.
  id: string;
  content: string;
  user_id: string;
  parent_id: string | null;
  users?: { username?: string | null , 
    profile_pic_key?: string | null,
      first_name?: string | null,
      last_name?: string | null} | 

    { username?: string | null , 
      first_name?: string | null,
      last_name?: string | null,
      profile_pic_key?: string | null}[] | 
      null;
};

// We define the Attachment and AttachmentRow types to represent media attachments for posts. Attachment is the type we use in our component state, while AttachmentRow represents the raw data we get from the database when we load attachments for a post. Each attachment includes its position so we can render them in the correct order.
type Attachment = {
  id: string;
  key: string;
  content_type?: string | null;
  file_name?: string | null;
  position?: number | null;
};

type AttachmentRow = {
  position: number | null;
  // Supabase can return the joined row as either a single object or an array containing one object,
  // so accept both shapes here (mirrors how `CommentRow.users` is typed above).
  user_media:
    | {
        id: string;
        key: string;
        content_type?: string | null;
        file_name?: string | null;
      }
    | {
        id: string;
        key: string;
        content_type?: string | null;
        file_name?: string | null;
      }[]
    | null;
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
      "id, content, created_at, user_id, parent_id, users(username, profile_pic_key, first_name, last_name)",
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
       profile_pic_key: joinedUser?.profile_pic_key || "",
      first_name: joinedUser?.first_name || "",
      last_name: joinedUser?.last_name || "",
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
  const [showReplies, setShowReplies] = useState(false); // hides and unhides replies
  const [showRepliesInput, SetShowRepliesInput]= useState(false) // shows/hides the prompt to reply to a comment
  const [newComment, setNewComment] = useState(""); // Stores new comment text before it's submitted.

  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString()
    : ""; // format the date as a local date string
  const trimmedContent = post.content.trim(); // trim the content to check if it's empty or just whitespace, so we can conditionally render it (if it's empty/whitespace, we won't render the <p> element at all)
  const mediaUrl = post.media_key ? getPublicUrl(post.media_key) : ""; // get the public URL for the media if there is a media key. This will be used to display the media in the post if it exists.

  /* ---------------- ATTACHMENTS (media files attached to the post) ---------------- */
  const mediaContentType = post.media_content_type?.toLowerCase() ?? ""; // normalize the content type to lowercase for easier checking. This will help us determine if the media is a video or an image, so we know whether to render a <video> or an <img> element in the post.
  const isVideoMedia =
    mediaContentType.startsWith("video/") ||
    /\.(mp4|mov|webm)$/i.test(post.media_key ?? ""); // we determine if the media is a video by checking if the content type starts with "video/" or if the media key ends with a common video file extension. This is important because we need to render videos with a <video> element and images with an <img> element for proper display and controls.
  const [attachments, setAttachments] = useState<
    {
      id: string;
      key: string;
      content_type?: string | null;
      file_name?: string | null;
      position?: number | null;
    }[]
  >([]); // this state will hold the media attachments for the post. We will load these from the database when the component mounts. Each attachment includes its position so we can render them in the correct order.
  // NOTE: We also declare the `Attachment` and `AttachmentRow` types above to avoid using `any` when processing DB rows.

  // When the component mounts, we load the attachments for the post from the database. We query the `post_media` table for rows matching our post ID, and we also join the `user_media` table to get the details of each media attachment (like its key and content type). We then transform the raw data from the database into our `Attachment` type and store it in state. This allows us to render all media attachments for the post in the UI.
  useEffect(() => {
    let active = true; // we use this flag to prevent state updates if the component unmounts before the async operation completes, which can cause memory leaks or errors.

    const loadAttachments = async () => {
      // this function loads the media attachments for the post from the database.
      try {
        const { data, error } = await supabase
          .from("post_media") // query the post_media table to get attachments for this post
          .select(
            "position, user_media:user_media_id (id, key, content_type, file_name)",
          ) // we select the position from post_media and join the user_media table to get the details of each media attachment.
          .eq("post_id", post.id) // filter for attachments that belong to our post
          .order("position", { ascending: true }); // order by position so attachments are in the correct order for rendering
        if (error) {
          console.error("Error loading post attachments:", error);
          return;
        }
        if (!active) return; // if the component has unmounted, we don't want to update state, so we check the active flag before proceeding.
        const rows = (data as AttachmentRow[] | null) ?? []; // we cast the data to our AttachmentRow type, and default to an empty array if it's null.
        // we then map the raw database rows to our Attachment type, extracting the media details from the joined user_media data. We also filter out any rows where the media details are missing (i.e., if the join failed for some reason), and we end up with an array of attachments that we can render in our post.
        const mapped = rows
          .map((r) => {
            const raw = r.user_media;
            const um = Array.isArray(raw) ? raw[0] : raw;
            return um
              ? {
                  id: um.id,
                  key: um.key,
                  content_type: um.content_type,
                  file_name: um.file_name,
                  position: r.position,
                }
              : null;
          })
          .filter(Boolean) as Attachment[]; // filter out any nulls that may have resulted from failed joins, ensuring we only have valid attachments in our state.
        setAttachments(mapped); // we update our attachments state with the loaded attachments, which will trigger a re-render and display the media in the post.
      } catch (e) {
        console.error("Failed to load attachments", e);
      }
    };

    void loadAttachments(); // we call the function to load attachments when the component mounts.

    return () => {
      // this runs when the component unmounts, which can happen if the user navigates away from the page before the attachments finish loading. By setting active to false, we can avoid trying to update state on an unmounted component, which would cause a memory leak or error.
      active = false;
    };
  }, [post.id]);

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

    const handleShowReplies = () => {
      setShowReplies((prev) => !prev);
  };
      const handleReplyBox = () => {
      SetShowRepliesInput((prev) => !prev);
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
      // use a join fuckhead!!!
      .select(
        "id, content, user_id, users(username, profile_pic_key, first_name, last_name)",
      ) // also get the username of the commenter
      .single();
      console.log("here is the data:")
      console.log(data)

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
      profile_pic_key: data.users?.[0]?.profile_pic_key ,
      first_name: data.users?.[0]?.first_name ,
      last_name : data.users?.[0]?.last_name , 
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

      {(attachments.length > 0 || mediaUrl) && (
        <div className="profile-post-media-wrap">
          {attachments.length > 0 ? (
            attachments.map((a) => {
              const url = getPublicUrl(a.key);
              const isVideo =
                !!a.content_type && a.content_type.startsWith("video/");
              return isVideo ? (
                <video
                  key={a.id}
                  className="profile-post-media"
                  src={url}
                  controls
                  preload="metadata"
                />
              ) : (
                <img
                  key={a.id}
                  className="profile-post-media"
                  src={url}
                  alt={a.file_name ?? `${displayName}'s post media`}
                  loading="lazy"
                />
              );
            })
          ) : isVideoMedia ? (
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

            <Button variant="secondary" size="sm" onClick={handleAddComment} type="submit" children="Post Comment" className="submit-comment-btn"/>
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
                <div className="display-comment">
                  {comment.profile_pic_key ?(
                <div style={{ fontWeight: "bold" }}> <img src={getPublicUrl(comment.profile_pic_key ?? "")} alt="Profile" className="profile-avatar-comment" />  </div>) :
                <div className="profile-avater-placeholder-comment">No Photo </div>
                  }
                <div  className="display-user">
                  <strong className="display-first-last">{comment.first_name} {comment.last_name} <div className="profile-post-time">{formattedDate}</div></strong>
                  <div className="display-handle">@{comment.username}</div>
                  <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>{comment.text}</div>
                </div>
                </div>
                <div style={{display: "flex", width: "30%", justifyContent: "space-between"}}>
                  <Button variant="secondary" size="sm" onClick={handleShowReplies} type="submit" children="Show Replies" className="submit-comment-btn"/>
                  <Button variant="secondary" size="sm" onClick={handleReplyBox} type="submit" children="Reply" className="submit-comment-btn"/>
                  </div>
                {/* Replies */}
                {showRepliesInput && (             
                  // Replies Input
                  <Replies
                          parentId={comment.id}
                          postId={id}
                        onReplyAdded={(newReply) => {
                            setComments((prev) =>
                            prev.map((c) =>
                                c.id === comment.id
                              ? { ...c, replies: [...
                                (c.replies || []),
                                 newReply] }
                                  : c
                              )
                            );
                          }}
                          fetchComments={() => fetchComments(id, setComments)}
                        />)}

                    {showReplies && (
                      <>
                      
                        {comment.replies?.map((reply) => (
                          <div style={{display: "flex", marginLeft: "3rem", marginTop: "1rem"}}>
                             {reply.profile_pic_key ?(
                <div style={{ fontWeight: "bold" }}> <img src={getPublicUrl(reply.profile_pic_key ?? "")} alt="Profile" className="profile-avatar-comment" />  </div>) :
                <div className="profile-avater-placeholder-comment">No Photo </div>
                  }
                          <div
                            key={reply.id}
                          >
                             <div  className="display-user">
                      
                              
                                <strong className="display-first-last">{reply.first_name} {reply.last_name}<div className="profile-post-time">{formattedDate}</div></strong>
                                <div className="display-handle">@{reply.username}</div>
                                <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>{reply.text}</div>
                            </div>
                          </div>
                          </div>
                        ))}
                      </>
                    )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
