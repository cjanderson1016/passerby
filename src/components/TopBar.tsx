import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import AddFriendModal from "./AddFriendModal";
import Notifications from "./Notifications";
import Modal from "./Modal";
import { useUser } from "../hooks/useUser";
import personAddIcon from "../assets/person_add.svg";
import "../features/dashboard.css";

interface TopBarProps {
  showActions?: boolean;
  showBack?: boolean;
}

export default function TopBar({ showActions = false, showBack = false }: TopBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();
  const currentUserId = user?.id ?? null;

  return (
    <>
      <div className="dash-topbar">
        {showBack && (
          <button className="msg-back-btn" onClick={() => navigate("/")} title="Back to Dashboard">
            &#8592;
          </button>
        )}

        <div className="dash-title">PASSERBY</div>

        {showActions ? (
          <div className="dash-top-actions">
            <div className="dash-action-group">
              <Link to="/messages" className="dash-icon-btn" title="Messages">
                <span className="dash-message-icon">✉</span>
              </Link>

              <button
                type="button"
                className="dash-icon-btn"
                title="Notifications"
                aria-haspopup="dialog"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen(true)}
              >
                <span className="material-symbols-outlined dash-notification-icon" aria-hidden="true">
                  notifications
                </span>
              </button>

              <button
                type="button"
                className="dash-icon-btn"
                title="Add Friend"
                onClick={() => setModalOpen(true)}
              >
                <img src={personAddIcon} alt="Add Friend" className="dash-icon-img" />
              </button>
            </div>

            <ProfileMenu />
          </div>
        ) : (
          <ProfileMenu />
        )}
      </div>

      {showActions && currentUserId && (
        <>
          <Modal
            is_open={modalOpen}
            current_state={setModalOpen}
            component={
              <AddFriendModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                currentUserId={currentUserId}
              />
            }
            title="Add Friend"
          />
          <Modal
            is_open={notificationsOpen}
            current_state={setNotificationsOpen}
            component={<Notifications onClose={() => setNotificationsOpen(false)} />}
            title="Notifications"
          />
        </>
      )}
    </>
  );
}
