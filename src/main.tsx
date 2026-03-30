/*
  File Name: main.tsx

  Description:
  Entry point of the Passerby React application.
  This file initializes the React root using React 18’s createRoot API
  and renders the application within React StrictMode.
  */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { router } from "./app/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProvider>
      {" "}
      {/* Wrap the app in UserProvider to provide authentication context to all components */}
      <RouterProvider router={router} />{" "}
      {/* RouterProvider is used to set up routing in the app based on the configuration defined in router.tsx */}
    </UserProvider>
  </StrictMode>,
);
