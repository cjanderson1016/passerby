/*
  File Name: UserSettings.tsx

  Description: A settings page that lets users:
    - Change their username
    - Change their password
    - Delete their account
    - Change who can see their comments/posts/likes



  Author(s): Owen Berkholtz
*/
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
//import { useNavigate } from "react-router-dom";
import ProfileMenu from "../components/ProfileMenu";
import "./settings.css"
import Accordion_Component from "../components/Accordion";
import { Privacy_Dropdown} from "../components/Accordion";
import Modal from "../components/Modal";
import ResetPass from "./ResetPassword";
import { FaRegUser, FaUnlockAlt } from "react-icons/fa";


export default function Settings(){
  //useState hooks
    const [user, setUser] = useState("");
    const [newUser, setNewUser] = useState("");
    const [openModal_pass, setOpenModal_pass] = useState(false);
    const [openModal_delete, setOpenModal_delete] = useState(false);
    const [openModal_user, setOpenModal_user] = useState(false);


//List that contains the settings information for an accordion style menu. (see accordion.tsx)
const settings_list = [
  // Container 1: Account settings --> reset password, delete account
  {
    id: "1",
    title: [<FaRegUser style={{ color: "red", margin: "0 5px" }} />, "Account Settings"],

    content: [
      [<button  className = "settings-btn" onClick={() => setOpenModal_pass(true)}>Change Password</button>],
      [<button className="settings-btn-important" onClick={() => setOpenModal_delete(true)}>Delete Account</button>],
    ],
  },
  {
    // Container 2: Privacy & Visibilty --> Others can see my posts/comments/likes
    id: "2",
    title: [<FaUnlockAlt style={{ color: "blue", margin: "0 5px" }}/>, "Privacy and Visibility"],

    content: [
      [<strong>Who can see my content:</strong>],

      ["  Posts", <Privacy_Dropdown data_field ={ 0 } storageKey="store_posts_privacy"/>],
      ["  Comments", <Privacy_Dropdown data_field ={ 1 } storageKey="store_comments_privacy"/>],
      ["  Profile",<Privacy_Dropdown data_field ={ 2 } storageKey="store_profile_privacy"/>],


    ],
  }
];
 // fetch username once if we don't already have it
  useEffect(() => {
    const fetchUsername = async () => {
      if (user) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) return;
        const { data } = await supabase
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single();
        setUser(data?.username ?? "");
      } catch (err) {
        console.error("error fetching username for profile link", err);
      }
    };
    fetchUsername();
  }, [user]);


  return (
    <div>
      <div className="dash-page">
        {/* Top bar */}
        <div className="dash-topbar">
          <div className="dash-title">PASSERBY</div>

          {/* profile button/dropdown moved into its own component */}
          <ProfileMenu />
        </div>
        <div className="settings-title">
          <h1>Profile Settings</h1>
        </div>

        <div className="settings-body">
          <div className="change_user">
            <form onSubmit={(e) => e.preventDefault()}>
              Username:
              <input
                type="textbox"
                placeholder={user}
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                style={{ marginLeft: "5px", padding: "5px" }}
              />
              <button
                onClick={() => setOpenModal_user(true)}
                style={{ marginLeft: "5px", padding: "5px", cursor: "pointer" }}
              >
                Change Username
              </button>
            </form>
          </div>
          <Accordion_Component settings_list={settings_list}/>
          <br />
        </div>
        <Modal is_open={openModal_pass} current_state={setOpenModal_pass} component={<ResetPass/>}/>
        <Modal is_open={openModal_user} current_state={setOpenModal_user} component={<ConfirmChangeUsername newUser={newUser}
                                                                                                            setUser={setUser}
                                                                                                            setNewUser={setNewUser}
                                                                                                            closeModal={() => setOpenModal_user(false)}/>}/>
      <Modal is_open={openModal_delete} current_state={setOpenModal_delete} component={<ConfirmDeleteUser
      closeModal={() => setOpenModal_delete(false)}
    />
  }
/>

      </div>
    </div>
  );
}

{/* Popup that comes up when the user wants to update their password. */}
interface ConfirmUserParams {
  newUser: string;
  setUser: React.Dispatch<React.SetStateAction<string>>;
  setNewUser: React.Dispatch<React.SetStateAction<string>>;
  closeModal: () => void;
}

function ConfirmChangeUsername ({newUser, setUser, setNewUser, closeModal} : ConfirmUserParams){
const [confirmPassword, setConfirmPassword] = useState("");
const handleUsernameReset = async (e: React.FormEvent) => {
  e.preventDefault();

  const normalizedUsername = newUser.trim().toLowerCase();
  const usernameRegex = /^[a-z0-9_]{3,}$/;

  if (!normalizedUsername) {
    alert("You Must Enter New Username!");
    return;
  }

  if (!usernameRegex.test(normalizedUsername)) {
    alert("Username must be 3+ lowercase characters and only include letters, numbers, and underscores.");
    return;
  }

  try{
const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        alert("Could not get user info. Please try again.");
        return;
      }

      // Reauthenticate user with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: confirmPassword,
      });

      if (signInError) {
        alert("Current password is incorrect.");
        return;
      }
  
   const { data: existing } = await supabase
   .from("users")
      .select("id")
  .eq("username", normalizedUsername)
  .maybeSingle();
  if (existing) {
    alert("That user already exists!");
    return;
}
  // Update username
  await supabase
    .from("users")
    .update({ username: normalizedUsername })
    .eq("id", user.id);

  // Update thelocal state
  setUser(normalizedUsername);
  setNewUser("");


  alert("Username Changed Successfully!");
  closeModal();
}
catch(error){
  alert("Sorry, Could not Change your Username...")
}
};

return (
  <div className="confirm_box">
    <h2> Attention</h2>
    You are about to change your username. Would you like to proceed?
              <input
            type="password"
            placeholder="Enter your password..."
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: "50%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginTop: "30px"
            }}
          />
    <div>
      <button onClick={handleUsernameReset} className="confirm_accept">
        Yes
      </button>
    </div>
  </div>
)
}

function ConfirmDeleteUser({ closeModal }: { closeModal: () => void }) {
  const [password, setPassword] = useState("");

  const handleUserDelete = async () => {
    try {
      // Get logged-in user
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        alert("Could not verify user session.");
        return;
      }

      //Re-authenticate
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        alert("Incorrect password.");
        return;
      }

      // delete from auth.users
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteAuthError) {
        alert("Could not delete user from authentication.");
        return;
      }

      //Delete from public.users table
      await supabase.from("users").delete().eq("id", user.id);

      alert("Your account has been deleted.");

      closeModal();

      //Log out
      await supabase.auth.signOut();

    } catch (error) {
      alert("Something went wrong. Could not delete user.");
    }
  };

  return (
    <div className="confirm_box">
      <h2
      style = {{ color : "red"}}>Delete Account</h2>
      <p>This action is permanent. Please enter your password to confirm.</p>

      <input
        type="password"
        placeholder="Enter your password..."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{
          width: "60%",
          padding: "0.5rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
          marginTop: "20px"
        }}
      />

      <div style={{ marginTop: "20px" }}>
        <button className="confirm_accept" onClick={handleUserDelete}>
          Yes, Delete My Account
        </button>
      </div>
    </div>
  );
}

