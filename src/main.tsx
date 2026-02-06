import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import "./index.css";  // included in the Vite default template, but not currently used in the Passerby app. I am keeping it here for reference, but it is not imported in the current version of the app.
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
