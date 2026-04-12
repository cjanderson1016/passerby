/*
  File Name: Dashboard.tsx

  Description: This file defines the main signup component for the application.

  Author(s): Connor Anderson, Owen Berkholtz
  */
import { useState } from "react";
import { supabase } from "../lib/supabase";
import "./Signup.css";



interface ForgotPassProps {
  exitModal?: () => void;
}

type UserUpdate = {
  username: string;
  first_name: string;
  last_name: string;
};

function ForgotPassEmail({ exitModal }: ForgotPassProps) {
  const [email, setEmail] = useState("");

   async function handleForgotPassword(email: string) {

    if (!email.includes("@")) {
      alert("Please include a valid email!");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/recovery",
    });

    if (error) {
      console.error("Error, could not reset password!", error.message);
      alert("Something went wrong. Try again.");
      return;
    }

    // success!
    alert("If an account with that email exists, a reset link has been sent.");

    // close modal
    exitModal?.();
  }



  return (
    <div className="signup-shell">
      <div className="signup-container">
        <div style={{marginBottom: "1rem"}}>
            Please enter your email address so that we can send you a password recovery link
        </div>
        <form className="signup-form">
          <div className="signup-row">
            <label className="signup-label">
              Email:
            </label>
            <input
              className="signup-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </form>
        <div className="signup-actions">
          <button
            className="signup-btn"
            type="button"
            onClick={() => handleForgotPassword(email)}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassEmail;
