/*
  File Name: AddFriendModal.tsx

  Description: Modal component triggered by the "Add Friend" button on the dashboard.
  Allows users to search for another user by exact username and send a friend request.
  Handles error states for users not found, already friends, and duplicate pending requests.

  Author(s): Bryson Toubassi
*/

import { useState } from "react";
import { supabase } from "../lib/supabase";
import "./AddFriendModal.css";

interface FoundUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export default function AddFriendModal({
  isOpen,
  onClose,
  currentUserId,
}: AddFriendModalProps) {
  const [searchInput, setSearchInput] = useState("");
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reset = () => {
    setSearchInput("");
    setFoundUser(null);
    setSearching(false);
    setSending(false);
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSearch = async () => {
    const username = searchInput.trim().toLowerCase();
    if (!username) return;

    setError("");
    setSuccess("");
    setFoundUser(null);
    setSearching(true);

    const { data, error: fetchError } = await supabase
      .from("users")
      .select("id, username, first_name, last_name")
      .eq("username", username)
      .maybeSingle();

    setSearching(false);

    if (fetchError || !data) {
      setError("User not found");
      return;
    }

    if (data.id === currentUserId) {
      setError("You can't add yourself as a friend");
      return;
    }

    setFoundUser(data);
  };

  const handleSendRequest = async () => {
    if (!foundUser) return;

    setSending(true);
    setError("");

    const { error: rpcError } = await supabase.rpc("send_friend_request", {
      to_user: foundUser.id,
    });

    setSending(false);

    if (rpcError) {
      const msg = rpcError.message;
      if (msg.includes("Already friends")) {
        setError("You're already friends with this user");
      } else if (msg.includes("Request already pending")) {
        setError("A friend request is already pending");
      } else {
        setError(msg);
      }
      return;
    }

    setSuccess(`Friend request sent to ${foundUser.first_name}!`);
    setFoundUser(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="afm-overlay" onClick={handleClose}>
      <div className="afm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="afm-header">
          <span className="afm-title">Add Friend</span>
          <button className="afm-close" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="afm-body">
          <div className="afm-search-row">
            <input
              className="afm-input"
              type="text"
              placeholder="Enter exact username"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button
              className="afm-search-btn"
              onClick={handleSearch}
              disabled={searching || !searchInput.trim()}
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          {error && <div className="afm-error">{error}</div>}
          {success && <div className="afm-success">{success}</div>}

          {foundUser && !success && (
            <div className="afm-result">
              <div className="afm-result-info">
                <span className="afm-result-name">
                  {foundUser.first_name} {foundUser.last_name}
                </span>
                <span className="afm-result-username">
                  @{foundUser.username}
                </span>
              </div>
              <button
                className="afm-send-btn"
                onClick={handleSendRequest}
                disabled={sending}
              >
                {sending ? "Sending..." : "Send Request"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
