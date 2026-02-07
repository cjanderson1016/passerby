// This is the main App component for the Passerby application. It currently renders a simple header, but will be expanded in the future to include more functionality and components as the application is developed.

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // Import the pre-configured Supabase client from our lib/supabase.ts file. This keeps our database configuration centralized and reusable across the app.
import RouteButton from "../components/RouteButton"; // Import a reusable Button component for navigation. This is just an example of how we can build out our UI with shared components.

// Lightweight type describing the instrument rows we expect from the DB.
// Adding this helps TypeScript understand shapes used in the UI.
type Instrument = {
  id?: number;
  name: string;
};

function App() {
  // State holds the fetched instruments. Start with an empty array.
  const [instruments, setInstruments] = useState<Instrument[]>([]);

  useEffect(() => {
    // `mounted` guard prevents calling `setInstruments` after unmount.
    let mounted = true;

    // Use an async IIFE (Immediately Invoked Function Expression) so we can await inside useEffect.
    (async () => {
      // NOTE: Supabase `from` in v2 typings can expect 2 generics depending on
      // how the client is typed. To avoid the "Expected 2 type arguments"
      // error we call `.from("instruments")` without generics and cast the
      // returned `data` to `Instrument[]` when setting state.
      const { data, error } = await supabase.from("instruments").select("*");

      if (error) {
        // Log and bail on error; don't update state.
        console.error("Error fetching instruments:", error);
        return;
      }

      // Only update state if component is still mounted. Cast `data` to the
      // expected `Instrument[]` shape; `data` may be `null` if no rows exist.
      if (mounted) setInstruments((data ?? []) as Instrument[]);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Render the list of instruments. Use `id` as key when available, fall back
  // to `name` as a stable string key.
  return (
    <div>
      <h1>App Page</h1>
      <RouteButton to="/about">Go to About</RouteButton>
      <ul>
        {instruments.map((instrument) => (
          <li key={instrument.id ?? instrument.name}>{instrument.name}</li>
        ))}
      </ul>
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
