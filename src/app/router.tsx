/*
  File Name: router.tsx

  Description: Defines the  central routing configuration for Passerby.

  Author(s): Connor Anderson
*/
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
// import About from "../features/test/About";
import Profile from "../features/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  // {
  //   path: "/about",
  //   element: <About />,
  // },
  // maintain a plain /profile route for backwards compatibility or
  // cases where the username is not yet known; it renders the same component.
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    // profile route now includes username as a dynamic segment. the component
    // can still fetch the authenticated user itself, but the URL reflects the
    // user's chosen username for bookmarking/linking.
    path: "/profile/:username",
    element: <Profile />,
  },
]);
