/*
  File Name: Profile.tsx

  Description: Simple placeholder component for a user's profile page.  We'll expand it later.

  Author(s): Connor Anderson, Matthew Eagleman
*/

import { Link, useParams } from "react-router-dom";
import { useEffect, useState} from "react";
import { useUser } from "../hooks/useUser";
import Activity from "../components/Activity";
import Bulletin from "../components/Bulletin";

// We will need to decide how to load profile pages in the future.
// For now, this just loads the current user's profile based on their session.

export default function Profile() {
  // Get the username from the route -- TODO: use this to load other users' profiles, currently we just load the authenticated user's profile regardless of the route param
  const { username: routeUsername } = useParams<{ username: string }>();
  const { userProfile } = useUser();
  const [ currentTab, setCurrentTab ] = useState(0); // 0 = bulliton, 1 = activity, etc. We can add more tabs later if we like.

  const displayName =
    userProfile && (userProfile.first_name || userProfile.last_name)
      ? `${userProfile.first_name ?? ""} ${userProfile.last_name ?? ""}`.trim()
      : null;

  // fetch posts whenever we know which profile we are viewing
  useEffect(() => {
    if (!userProfile?.id) return;

  }, [userProfile?.id]);

  return (
    <div
      className="profile-page"
      style={{ padding: "24px", fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* Shows the first and last name of the user profile and the username from the url (if available) */}
      <h1>
        {displayName ? `Welcome, ${displayName}!` : "Welcome!"}
        {routeUsername && (
          <span style={{ fontWeight: "normal" }}> (@{routeUsername})</span>
        )}
      </h1>
      {/* Shows the username of the user profile */}
      {userProfile?.username && (
        <p>
          <strong>Username:</strong> @{userProfile.username}
        </p>
      )}

      {!userProfile?.username && <p>No username set.</p>}

      <button onClick={() => setCurrentTab(0)}>Bulliton</button>
      <button onClick={() => setCurrentTab(1)}>Activity</button>

      <Bulletin show={currentTab === 0} />
      <Activity show={currentTab === 1} />

      <Link to="/">← Back to dashboard</Link>
    </div>
  );
}
