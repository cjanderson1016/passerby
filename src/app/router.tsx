/*
  File Name: router.tsx

  Description: Defines the  central routing configuration for Passerby.

  Author(s): Connor Anderson
*/
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import About from "../features/test/About";
import Reset from "../features/ResetPassword"
import Settings from "../features/UserSettings"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/reset_pass",
    element: <Reset/>
  },
  {
    path: "/settings",
    element: <Settings/>
  }

]);
