/*
  File Name: main.tsx

  Description:
  Entry point of the Passerby React application.
  This file initializes the React root using React 18’s createRoot API
  and renders the application within React StrictMode.
  */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import "./index.css";  // included in the Vite default template, but not currently used in the Passerby app. I am keeping it here for reference, but it is not imported in the current version of the app.
import { RouterProvider } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { router } from "./app/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  </StrictMode>,
);

