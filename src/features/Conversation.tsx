/*
  File Name: Conversation.tsx

  Description: Standalone full-page conversation thread route. Wraps
  ConversationThread with a page shell (topbar + back button) for direct
  URL access (e.g. bookmarks). The split-panel experience is handled by
  Messages.tsx which embeds ConversationThread inline.

  Author(s): Bryson Toubassi
*/

import { useNavigate, useParams } from "react-router-dom";
import ProfileMenu from "../components/ProfileMenu";
import ConversationThread from "../components/ConversationThread";
import "./messages.css";

export default function Conversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  return (
    <div className="msg-page">
      <div className="msg-thread-header">
        <button className="msg-back-btn" onClick={() => navigate("/messages")}>
          &#8592;
        </button>
        <span className="msg-thread-name" style={{ flex: 1 }} />
        <ProfileMenu />
      </div>
      <ConversationThread
        conversationId={conversationId!}
        onBack={() => navigate("/messages")}
      />
    </div>
  );
}
