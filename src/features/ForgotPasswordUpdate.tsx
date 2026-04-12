/*
  File Name: Dashboard.tsx

  Description: This file defines the main signup component for the application.

  Author(s): Connor Anderson
  */
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./Signup.css";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

interface SignupProps {
  onSwitchToLogin: () => void;
}

type UserUpdate = {
  username: string;
  first_name: string;
  last_name: string;
};

function ForgottenPass() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const[isSuccessful, SetisSuccessful] = useState(false);
    const navigate = useNavigate();

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

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
