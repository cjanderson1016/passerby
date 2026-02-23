/*
  File Name: router.tsx

  Description: Defines the  central routing configuration for Passerby.

  Author(s): Connor Anderson
*/
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import About from "../features/test/About";
import Dashboard from "../features/Dashboard";
import Login from "../features/Login";
import Signup from "../features/Signup";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/about",
    element: <About />,
  },
]);
