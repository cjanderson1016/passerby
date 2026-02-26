/*
  File Name: Profile.tsx

  Description: Simple placeholder component for a user's profile page.  We'll expand it later.

  Author(s): ChatGPT (generated)
*/

import { Link } from "react-router-dom";

export default function Profile() {
  return (
    <div className="profile-page" style={{ padding: "24px", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <h1>User Profile</h1>
      <p>This page will show the current user's profile information.</p>
      <Link to="/">← Back to dashboard</Link>
    </div>
  );
}
