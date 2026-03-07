/*
  File Name: Profile.tsx

  Description: Simple placeholder component for a user's profile page.  We'll expand it later.

  Author(s): Connor Anderson, Matthew Eagleman
*/

import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "../hooks/useUser";
import Activity from "../components/Activity";
import Bulletin from "../components/Bulletin/Bulletin";
import ProfileMenu from "../components/ProfileMenu";
import "../features/Profile.css"; // styles specific to the profile page, such as the tab buttons and layout
import ProfilePictureUpload from "../components/ProfilePictureUpload";
import { supabase } from "../lib/supabase";
import { getPublicUrl } from "../services/dataService";

interface ViewedProfile {
  // this is the shape of the profile data we load for the profile page, which is a subset of the full user data
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  profile_pic_key: string | null;
}

export default function Profile() {
  const { username: routeUsername } = useParams<{ username: string }>();
  const { user, userProfile } = useUser();
  const [currentTab, setCurrentTab] = useState(0); // 0 = bulliton, 1 = activity, etc. We can add more tabs later if we like.
  const [viewedProfile, setViewedProfile] = useState<ViewedProfile | null>( // the profile data for the profile we are currently viewing, which may be our own or a friend's depending on the route and access
    null,
  );
  const [loadingProfile, setLoadingProfile] = useState(true); // whether we are still loading the profile data, used to show a loading state while we fetch from the database
  const [profileError, setProfileError] = useState<string | null>(null); // any error message related to loading the profile, used to show an error state if we fail to load the profile data

  // we derive a display name to show on the profile page based on the first and last name, but fall back to just the username if we don't have either of those
  const displayName =
    viewedProfile && (viewedProfile.first_name || viewedProfile.last_name)
      ? `${viewedProfile.first_name ?? ""} ${viewedProfile.last_name ?? ""}`.trim()
      : null;

  // load the profile data for the profile we are viewing whenever the route username or current user changes. This includes access control to ensure we can only view our own profile or profiles of accepted friends.
  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      // async function to load the profile data for the profile we are viewing, including access control checks
      // if we don't have a logged in user, we can't load any profile data
      if (!user?.id) {
        if (!isActive) return;
        setViewedProfile(null);
        setProfileError("Please sign in to view profiles.");
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      setProfileError(null);

      // we first determine which profile we are trying to view based on the route. If the route username is missing or matches our own username, we are trying to view our own profile. Otherwise, we are trying to view someone else's profile based on the username in the route.
      const requested = routeUsername?.trim().toLowerCase();
      const ownUsername = userProfile?.username?.toLowerCase();

      // if we are trying to view our own profile (either no username in route, or it matches our username), we can skip some of the access control checks and just load our own profile data
      if (!requested || requested === ownUsername) {
        if (userProfile) {
          if (!isActive) return;
          setViewedProfile({
            id: userProfile.id,
            username: userProfile.username,
            first_name: userProfile.first_name ?? null,
            last_name: userProfile.last_name ?? null,
            profile_pic_key: userProfile.profile_pic_key ?? null,
          });
          setLoadingProfile(false);
          return;
        }

        // if we don't have the userProfile from context for some reason, we can try to load it directly from the database as a fallback, though this should be rare since we load the userProfile on login and keep it in context.
        const { data: ownProfile, error: ownProfileError } = await supabase
          .from("users")
          .select("id, username, first_name, last_name, profile_pic_key")
          .eq("id", user.id)
          .maybeSingle();

        if (!isActive) return; // check if the component is still mounted before setting state

        // if we have an error loading our own profile, or the profile is missing (which shouldn't happen since we have an authenticated user, but we check just in case), show an error
        if (ownProfileError || !ownProfile) {
          console.error("error loading current profile", ownProfileError);
          setViewedProfile(null);
          setProfileError("Could not load your profile.");
          setLoadingProfile(false);
          return;
        }

        // if our own profile is missing a username (which is required), show an error since we won't be able to display the profile properly
        if (!ownProfile.username) {
          setViewedProfile(null);
          setProfileError("Your profile is missing a required username.");
          setLoadingProfile(false);
          return;
        }

        // if we successfully loaded our own profile, set it in state to view our profile page
        setViewedProfile(ownProfile as ViewedProfile);
        setLoadingProfile(false);
        return;
      }

      // if we are trying to view someone else's profile, we first need to load that profile based on the username in the route, and then check if we have access to view it (i.e. it's either our own profile or a profile of an accepted friend)
      const { data: targetProfile, error: byUsernameError } = await supabase
        .from("users")
        .select("id, username, first_name, last_name, profile_pic_key")
        .eq("username", requested)
        .maybeSingle();

      // if we have an error loading the target profile by username, show an error. If we just have no data (i.e. no profile with that username), we handle that case separately below to show a "not found" message, since it's not really an "error" to have no matching profile for a given username.
      if (byUsernameError) {
        if (!isActive) return;
        console.error(
          "error loading target profile by username",
          byUsernameError,
        );
        setViewedProfile(null);
        setProfileError("Could not load that profile.");
        setLoadingProfile(false);
        return;
      }

      if (!isActive) return; // check if the component is still mounted before setting state

      // if we have no target profile data, or the target profile is missing a username (which is required), show a "not found" error
      if (!targetProfile || !targetProfile.username) {
        setViewedProfile(null);
        setProfileError("Profile not found.");
        setLoadingProfile(false);
        return;
      }

      // if the target profile we are trying to view is our own profile, we can just show it without further access control checks
      if (targetProfile.id === user.id) {
        setViewedProfile(targetProfile);
        setLoadingProfile(false);
        return;
      }

      let canViewTarget = false; // we will determine whether we can view the target profile based on whether it's our own profile or a profile of an accepted friend. We can use a RPC to check this access control logic in the database, or if the RPC is unavailable for some reason, we can fall back to checking the friend_requests table directly from the client (though this is less ideal since it exposes more of our data fetching logic to the client and may be less efficient, but it allows us to still enforce access control even if there are issues with the RPC).

      // first we try to use the RPC to check if we can view the target profile, which is the ideal way since it keeps the access control logic in the database and abstracts away the details from the client. If there is an error calling the RPC, we log a warning and fall back to checking the friend_requests table directly from the client.
      const { data: canViewData, error: canViewError } = await supabase.rpc(
        "can_view_profile",
        {
          target_user: targetProfile.id,
        },
      );

      // if the RPC call succeeds and returns a boolean, we use that to determine if we can view the target profile. If there is an error calling the RPC, or the RPC doesn't return a boolean for some reason, we fall back to checking the friend_requests table directly from the client to see if there is an accepted friend request between the current user and the target profile user.
      if (!canViewError && typeof canViewData === "boolean") {
        canViewTarget = canViewData;
      } else {
        // if there is an error calling the RPC, we log a warning and fall back to checking the friend_requests table directly from the client, which is less ideal but allows us to still enforce access control even if there are issues with the RPC
        if (canViewError) {
          console.warn(
            "can_view_profile RPC unavailable, using client fallback",
            canViewError,
          );
        }

        // we check the friend_requests table to see if there is an accepted friend request between the current user and the target profile user, which would allow us to view the profile. We check for both directions of the friend request (i.e. where the current user is the requester and the target is the recipient, or vice versa) since either way would indicate an accepted friendship.
        const { data: acceptedRows, error: acceptedError } = await supabase
          .from("friend_requests")
          .select("id")
          .eq("status", "accepted")
          .or(
            `and(requester_id.eq.${user.id},recipient_id.eq.${targetProfile.id}),and(requester_id.eq.${targetProfile.id},recipient_id.eq.${user.id})`,
          )
          .limit(1);

        if (!isActive) return; // check if the component is still mounted before setting state

        // if there is an error checking the friend_requests table for accepted friendships, we log the error and show a generic access error message. We don't want to show a "not found" message in this case since the profile does exist, we just had an issue verifying access to it.
        if (acceptedError) {
          console.error("error checking profile access", acceptedError);
          setViewedProfile(null);
          setProfileError("Could not verify profile access.");
          setLoadingProfile(false);
          return;
        }

        canViewTarget = !!acceptedRows && acceptedRows.length > 0; // if we have any accepted friend request rows, that means we can view the target profile since it's a profile of an accepted friend
      }

      if (!isActive) return; // check if the component is still mounted before setting state

      // if we determine that we cannot view the target profile based on either the RPC or the client-side check, we show an access error message. We don't want to show a "not found" message since the profile does exist, we just don't have access to view it.
      if (!canViewTarget) {
        setViewedProfile(null);
        setProfileError(
          "You can only view your own profile or profiles of accepted friends.",
        );
        setLoadingProfile(false);
        return;
      }

      // if we get here, that means we can view the target profile, so we set it in state to show the profile page
      setViewedProfile(targetProfile);
      setLoadingProfile(false);
    };

    void loadProfile(); // we call the async function but don't await it since useEffect can't be async

    return () => {
      // when the component unmounts, we set isActive to false to prevent setting state on an unmounted component in any of the async functions
      isActive = false;
    };
  }, [routeUsername, user?.id, userProfile]);

  const isOwnProfile = !!viewedProfile?.id && viewedProfile.id === user?.id;
  const viewedProfilePictureUrl = viewedProfile?.profile_pic_key
    ? getPublicUrl(viewedProfile.profile_pic_key)
    : null;

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <div className="profile-title">PASSERBY</div>

        {/* profile button/dropdown moved into its own component */}
        <ProfileMenu />
      </div>
      {loadingProfile ? (
        <p style={{ padding: "16px" }}>Loading profile…</p>
      ) : profileError ? (
        <p style={{ padding: "16px" }}>{profileError}</p>
      ) : viewedProfile ? (
        <>
          {isOwnProfile ? (
            <ProfilePictureUpload />
          ) : (
            <div style={{ margin: "16px 0", textAlign: "center" }}>
              {viewedProfilePictureUrl ? (
                <img
                  src={viewedProfilePictureUrl}
                  alt="Profile"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #ccc",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    border: "2px dashed #ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#888",
                    fontSize: 14,
                    background: "#f0f0f0",
                    margin: "0 auto",
                  }}
                >
                  No Photo
                </div>
              )}
            </div>
          )}

          {/* Shows the first and last name of the viewed profile */}
          <h1>
            {isOwnProfile
              ? displayName
                ? `Welcome, ${displayName}!`
                : "Welcome!"
              : displayName || "Profile"}
            <span style={{ fontWeight: "normal" }}>
              {" "}
              (@{viewedProfile.username})
            </span>
          </h1>

          {/* Shows the username of the viewed profile */}
          <p>
            <strong>Username:</strong> @{viewedProfile.username}
          </p>

          <button onClick={() => setCurrentTab(0)}>Bulliton</button>
          <button onClick={() => setCurrentTab(1)}>Activity</button>

          <Bulletin show={currentTab === 0} profileUserId={viewedProfile.id} />
          <Activity
            show={currentTab === 1}
            profileUserId={viewedProfile.id}
            isOwnProfile={isOwnProfile}
          />
        </>
      ) : null}

      <Link to="/">← Back to dashboard</Link>
    </div>
  );
}
