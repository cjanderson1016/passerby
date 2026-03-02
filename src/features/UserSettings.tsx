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
import Toggle from "../components/ToggleButton";
import Accordion_Component from "../components/Accordion";
import Modal from "../components/Modal";
import ResetPass from "./ResetPassword";



export default function Settings(){
  //useState hooks
    const [user, setUser] = useState<null | any>(null);
    const [newUser, setNewUser] = useState("");
    const [openModal_pass, setOpenModal_pass] = useState(false);
    //const [openModal_delete, setOpenModal_delete] = useState(false);
    const [openModal_user, setOpenModal_user] = useState(false);


//List that contains the settings information for an accordion style menu. (see accordion.tsx)
const settings_list = [
  // Container 1: Account settings --> reset password, delete account
  {
    id: "1",
    title: "Account Settings",

    content: [
      [<button  className = "settings-btn" onClick={() => setOpenModal_pass(true)}>Change Password</button>],
      [<button  className = "settings-btn-important">Delete Account</button>],
    ],
  },
  {
    // Container 2: Privacy & Visibilty --> Others can see my posts/comments/likes
    id: "2",
    title: "Privacy and Visibility",

    content: [
      ["Other users can see: "],

      ["  Posts", <Toggle storageKey="toggle_posts"/>],
      ["  Comments", <Toggle storageKey="toggle_comments"/>],
      ["  Likes",<Toggle storageKey="toggle_likes"/>],


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
        setUser(data?.username ?? null);
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
          <form onSubmit={(e) => e.preventDefault()}
          
          
          >Username: 
            <input type="textbox" placeholder={user}
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)} style={{ marginLeft: "5px", padding: "5px"}}>
            </input>
            <button onClick={() => setOpenModal_user(true)} style={{ marginLeft: "5px", padding: "5px", cursor: "pointer" }}
            >Change Username</button>
          </form>
          </div>
          <br/>
          <Accordion_Component list={settings_list}/>
          
        </div>
        <Modal is_open={openModal_pass} current_state={setOpenModal_pass} component={<ResetPass/>}/>
        <Modal is_open={openModal_user} current_state={setOpenModal_user} component={<ConfirmChangeUsername newUser={newUser}
                                                                                                            setUser={setUser}
                                                                                                            setNewUser={setNewUser}/>}/>

      </div>
    </div>
  );
}

{/* Popup that comes up when the user wants to update their password. */}
interface ConfirmUserParams {
  newUser: string;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  setNewUser: React.Dispatch<React.SetStateAction<string>>;
}

function ConfirmChangeUsername ({newUser, setUser, setNewUser} : ConfirmUserParams){

const handleUsernameReset = async (e: React.FormEvent) => {
  e.preventDefault();

  try{
  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();


  const userId = user!.id;
  
   const { data: existing } = await supabase
   .from("users")
      .select("id")
  .eq("username", newUser)
  .maybeSingle();
  if (existing) {
    alert("That user already exists!");
    return;
}
  if(newUser === ""){
    alert("You Must Enter New Username!");
    return;
  }
  // Update username
  await supabase
    .from("users")
    .update({ username: newUser })
    .eq("id", userId);

  // Update thelocal state
  setUser(newUser);
  setNewUser("");

  alert("Username Changed Successfully!");
}
catch(error){
  alert("Sorry, Could not Change your Username...")
}
};

return (
  <div className="confirm_box">
    <h2> Attention</h2>
    You are about to change your username. Would you like to proceed?
    <div>
      <button onClick={handleUsernameReset} className="confirm_accept">
        Yes
      </button>
    </div>
  </div>
)
}

/*
function ConfirmDeleteUser (){
  const handleUserDelete = async (e: React.FormEvent) => {
  e.preventDefault();

  try{
  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

    const userId = user!.id;
      await supabase
    .from("users")
    .delete()
    .eq("id", userId);

    alert("User deleted successfully!");



  }catch (error) {

    alert("Something Went Wrong. Cannot Delete User")
  }
  }

return (
  <div>
    are you sure you want to delete your profile?
    <div>
      <button onClick={handleUserDelete}>
        Yes
      </button>
    </div>
  </div>
)
}
*/