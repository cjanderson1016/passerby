/*
  File Name: Dashboard.tsx

  Description: This file defines the main signup component for the application.

  Author(s): Connor Anderson
  */
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./Signup.css";

interface SignupProps {
  onSwitchToLogin: () => void;
}

type UserUpdate = {
  username: string;
  first_name: string;
  last_name: string;
};

function Signup({ onSwitchToLogin }: SignupProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<string>("");

  // Check username availability when the username field changes (with debouncing)
  useEffect(() => {
    // the check username function:
    const checkUsername = async () => {
      if (!username.trim()) {
        setUsernameValid(null);
        setUsernameMessage("");
        return;
      }

      // Validate username format (alphanumeric and underscore, 3+ chars)
      const usernameRegex = /^[a-z0-9_]{3,}$/;
      const candidate = username.trim().toLowerCase();
      if (!usernameRegex.test(candidate)) {
        setUsernameValid(false);
        setUsernameMessage(
          "Username must be 3+ lowercase characters and contain only letters, numbers, and underscores",
        );
        return;
      }

      // Check availability via Supabase RPC
      setUsernameCheckLoading(true); // show loading state
      try {
        // Call the RPC function "is_username_available" with the candidate username
        // This function should return a boolean indicating availability.
        // data (what is returned) is expected to be of the form { available: boolean, error: PostgrestError | null }
        const { data: available, error } = await supabase.rpc(
          "is_username_available",
          { candidate },
        );

        if (error) {
          // If there was an error calling the RPC, treat it as unavailable and show an error message
          setUsernameValid(false);
          setUsernameMessage("Error checking username availability");
        } else if (available) {
          // If the RPC call succeeded and the username is available
          setUsernameValid(true);
          setUsernameMessage("Username is available");
        } else {
          // If the RPC call succeeded but the username is not available
          setUsernameValid(false);
          setUsernameMessage("Username is already taken");
        }
      } catch {
        // If there was an unexpected error (e.g. network issue), treat it as unavailable and show an error message
        setUsernameValid(false);
        setUsernameMessage("Error checking username availability");
      } finally {
        // In any case, we are done checking, so turn off the loading state
        setUsernameCheckLoading(false);
      }
    };

    // Debounce the check by 500ms
    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      setError("First name, last name and username are required");
      setLoading(false);
      return;
    }

    // We also check the username validity state here to prevent submission if the username is not valid, which could happen if the user types a username and immediately submits before the availability check completes. This is a secondary check in addition to disabling the submit button, to ensure we don't attempt to sign up with an invalid username.
    if (usernameValid !== true) {
      setError("Please enter a valid, available username");
      setLoading(false);
      return;
    }

    try {
      const signUpResult = await supabase.auth.signUp({
        email,
        password,
      }); // There is a PostgreSQL trigger that will automatically create a new users row on signup.

      if (signUpResult.error) {
        setError(signUpResult.error.message);
        return;
      }

      if (!signUpResult.data?.user?.id) {
        setError("Signup failed: no user ID returned");
        return;
      }

      // Now update that row with the user profile data.
      try {
        // the data to update the user's profile in the public.users table
        const updateData: UserUpdate = {
          username: username.trim().toLowerCase(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        };

        const { error: updateError } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", signUpResult.data.user.id);

        if (updateError) {
          setError(
            `Signup succeeded but updating user profile failed: ${updateError.message}`,
          );
        } else {
          // Disable sign up alert since we have disabled email confirmations for now, but we may want to re-enable it in the future if we turn email confirmations back on.
          // alert(
          //   "Signup successful! Please check your email to confirm your account if required.",
          // );
        }
      } catch (updateErr) {
        setError(
          "Signup succeeded but updating user profile failed" +
            (updateErr instanceof Error ? `: ${updateErr.message}` : ""),
        );
      }
    } catch (err) {
      setError(
        "An unexpected error occurred" +
          (err instanceof Error ? `: ${err.message}` : ""),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-shell">
      <div className="signup-container">
        <h1 className="signup-logo">PASSERBY</h1>

        <form className="signup-form" onSubmit={handleSignup}>
          <div className="signup-row">
            <label className="signup-label" htmlFor="firstName">
              First Name:
            </label>
            <input
              className="signup-input"
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className="signup-row">
            <label className="signup-label" htmlFor="lastName">
              Last Name:
            </label>
            <input
              className="signup-input"
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="signup-row">
            <label className="signup-label" htmlFor="username">
              Username:
            </label>
            <div className="signup-input-wrap">
              <input
                className="signup-input"
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              {usernameCheckLoading && (
                <p className="signup-hint">Checking availability...</p>
              )}
              {usernameMessage && (
                <p
                  className={`signup-hint ${
                    usernameValid === true
                      ? "signup-hint-valid"
                      : "signup-hint-invalid"
                  }`}
                >
                  {usernameMessage}
                </p>
              )}
            </div>
          </div>

          <div className="signup-row">
            <label className="signup-label" htmlFor="email">
              Email:
            </label>
            <input
              className="signup-input"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="signup-row">
            <label className="signup-label" htmlFor="password">
              Password:
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
            <button
              className="signup-btn"
              type="submit"
              disabled={
                loading || usernameValid !== true || usernameCheckLoading
              }
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>

            <button
              className="signup-btn signup-btn-secondary"
              type="button"
              onClick={onSwitchToLogin}
            >
              Or: Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
