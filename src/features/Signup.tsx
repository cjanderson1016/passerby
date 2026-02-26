/*
  File Name: Dashboard.tsx

  Description: This file defines the main signup component for the application.

  Author(s): Connor Anderson
  */
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

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
      const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
      if (!usernameRegex.test(username.trim())) {
        setUsernameValid(false);
        setUsernameMessage(
          "Username must be 3+ characters and contain only letters, numbers, and underscores",
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
          { candidate: username.trim() },
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
          username: username.trim(),
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
          alert(
            "Signup successful! Please check your email to confirm your account if required.",
          );
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
    <div
      style={{
        maxWidth: "400px",
        margin: "0",
        padding: "2rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup}>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="firstName"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            First Name:
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="lastName"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            Last Name:
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="username"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            Username:
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: `1px solid ${
                usernameValid === true
                  ? "#28a745"
                  : usernameValid === false
                    ? "#dc3545"
                    : "#ccc"
              }`,
              borderRadius: "4px",
            }}
          />
          {usernameCheckLoading && (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666",
                marginTop: "0.25rem",
              }}
            >
              Checking availability...
            </p>
          )}
          {usernameMessage && (
            <p
              style={{
                fontSize: "0.875rem",
                color: usernameValid === true ? "#28a745" : "#dc3545",
                marginTop: "0.25rem",
              }}
            >
              {usernameMessage}
            </p>
          )}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="email"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            Email:
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            Password:
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="confirmPassword"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            Confirm Password:
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        {error && (
          <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={loading || usernameValid !== true || usernameCheckLoading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor:
              loading || usernameValid !== true || usernameCheckLoading
                ? "#ccc"
                : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              loading || usernameValid !== true || usernameCheckLoading
                ? "not-allowed"
                : "pointer",
          }}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: "1rem" }}>
        Already have an account?{" "}
        <button
          onClick={onSwitchToLogin}
          style={{
            background: "none",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Login
        </button>
      </p>
    </div>
  );
}

export default Signup;
