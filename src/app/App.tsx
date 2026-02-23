/*
  File Name: App.tsx

  Description:
  The main application component for the Passerby web application.
  This file manages global authentication state using Supabase,
  handles session persistence, and conditionally renders the
  appropriate view (Dashboard, Login, or Signup) based on the
  user’s authentication status.

  It also listens for authentication state changes and updates
  the UI accordingly. This component serves as the root-level
  controller for routing between authenticated and unauthenticated
  user experiences.

  Author(s): Connor Anderson, Owen Berkholtz, Bryson Toubassi, Jacob Richards, Matthew Eagleman
*/
import "./App.css";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";
import Dashboard from "../features/Dashboard";
import Login from "../features/Login";
import Signup from "../features/Signup";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"login" | "signup">("login");

  // Get app name from environment variable, with a fallback for development
  const appName =
    import.meta.env.VITE_APP_NAME ||
    "No Name Found (missing VITE_APP_NAME env var)";

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <h1>{appName}</h1>
      </div>
      <div className="auth-right">
        {view === "login" ? (
          <Login onSwitchToSignup={() => setView("signup")} />
        ) : (
          <Signup onSwitchToLogin={() => setView("login")} />
        )}
      </div>
    </div>
  );
}

export default App;

// The following was Vite Defualt App.tsx, which I have since deleted. I am keeping it here for reference, but it is not used in the current version of the app.

// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import "./App.css";

// function App() {
//   const [count, setCount] = useState(0);

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Passerby (React + Vite)</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   );
// }

// export default App;
