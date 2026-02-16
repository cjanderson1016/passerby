/*
  File Name: Dashboard.tsx

  Description: This file defines the main signup component for the application.

  Author(s): Connor Anderson
  */
import { useState } from "react";
import { supabase } from "../lib/supabase";

interface SignupProps {
  onSwitchToLogin: () => void;
}

function Signup({ onSwitchToLogin }: SignupProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Signup successful - user will be automatically logged in if email confirmation is not required
        // Otherwise, they need to confirm their email
        alert(
          "Signup successful! Please check your email to confirm your account.",
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
        margin: "2rem auto",
        padding: "2rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup}>
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
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: loading ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
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
