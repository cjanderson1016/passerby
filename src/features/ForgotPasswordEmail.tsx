/*
  File Name: ForgotPasswordEmail.tsx

  Description: This is the popup component for the first step of password recovery, where the user inputs their email to receive a reset link.

  Author(s): Connor Anderson, Owen Berkholtz
  */
import { useState } from "react";
import { supabase } from "../lib/supabase";
import "./Signup.css";


// prop to allow parent component to close the modal once the user submits the form
interface ForgotPassProps {
  exitModal?: () => void;
}



function ForgotPassEmail({ exitModal }: ForgotPassProps) {

  const [email, setEmail] = useState(""); // state for the email input

  // function to handle the password reset process
   async function handleForgotPassword(email: string) {

    // basic validation to check if the email includes an "@" symbol
    if (!email.includes("@")) {
      alert("Please include a valid email!");
      return;
    }

    // call supabase function to send the password reset email, with a redirect URL to the password update page
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
