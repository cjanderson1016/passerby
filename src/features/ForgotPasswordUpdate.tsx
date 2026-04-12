/*
  File Name: ForgotPasswordUpdate.tsx

  Description: This is a file for the final step of the password recovery process, where the user sets a new password after clicking the reset link in their email.

  Author(s): Owen Berkholtz
  */
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./Signup.css";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

interface SignupProps {
  onSwitchToLogin: () => void;
}


function ForgottenPass() {
    // state variables for form inputs and feedback messages
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const[isSuccessful, SetisSuccessful] = useState(false); // Check if the password reset was successful, to conditionally render the success message and button to return to dashboard
    const navigate = useNavigate();


    const handlePasswordReset = async (e: React.FormEvent) => {
        // prevent default form submission behavior and reset error/success messages
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // basic validation to check password length and confirm password match
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);


        // attempt to update the user's password using supabase's updateUser function
        try {
            const { error } = await supabase.auth.updateUser({
            password,
            });

            if (error) {
            setError(error.message);
            } else {
            setSuccess("Password updated successfully!");
            setPassword("");
            setConfirmPassword("");
            SetisSuccessful(true)
            }
            
        } catch (err) {
            setError(
            "Unexpected error" +
                (err instanceof Error ? `: ${err.message}` : "")
            );
        } finally {
            setLoading(false);
        }
        };

  return (   
  <div className="signup-shell">
      <div className="signup-container">
        { !isSuccessful ? (
            <>
        <h1 className="signup-logo">Reset Password</h1>
        <p style={{display: "flex", marginTop: "10px",justifyContent: "center"}}>Your identity has been verified. Please set your new password...</p>
        <form className="signup-form" onSubmit={handlePasswordReset}>
          <div className="signup-row">
            <label className="signup-label" htmlFor="password">
              New Password:
            </label>
            <input
              className="signup-input"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="signup-row">
            <label className="signup-label" htmlFor="confirmPassword">
              Confirm Password:
            </label>
            <input
              className="signup-input"
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="signup-error">{error}</p>}

          <div className="signup-actions">
            <button className="signup-btn" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>

            </>) : (
            <div>
                <h2>✔ Password Reset Successfully!</h2>

                <Button variant="primary" size="md" onClick={() =>navigate("/")} children="Return to Dashboard?">

                </Button>
            </div>
            )
        }
      </div>
    </div>
  );
}

export default ForgottenPass;
