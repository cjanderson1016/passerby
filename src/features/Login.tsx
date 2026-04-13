/*
  File Name: Login.tsx

  Description: This file defines the main login component for the application.

  Author(s): Connor Anderson
  */

import { useState } from "react";
import { supabase } from "../lib/supabase";
import "./Login.css";
import Modal from "../components/Modal";
import ForgotPass from "./ForgotPasswordEmail";

interface LoginProps {
  onSwitchToSignup: () => void;
}

function Login({ onSwitchToSignup }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // These are for the password recovery popup
  const [recoverOpen, setRecoverOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
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
    <div className="login-shell">
      <div className="login-container">
        <h1 className="login-logo">PASSERBY</h1>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-row">
            <label className="login-label" htmlFor="email">
              Email:
            </label>
            <input
              className="login-input"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-row">
            <label className="login-label" htmlFor="password">
              Password:
            </label>
            <input
              className="login-input"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="forgot-password" onClick={()=> setRecoverOpen(true)}>
            Forgot Password?
          </div>

          {error && <p className="login-error">{error}</p>}

          <div className="login-actions">
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <button
              className="login-btn login-btn-secondary"
              type="button"
              onClick={onSwitchToSignup}
            >
              Or: Sign Up
            </button>
          </div>
        </form>
      </div>
      <Modal is_open={recoverOpen} current_state={setRecoverOpen} component={<ForgotPass exitModal={() => setRecoverOpen(false)} />} title = {"Password Recovery"}/>
    </div>
  );
}

export default Login;
