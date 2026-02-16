/*
  File Name: router.tsx

  Description: Defines the  central routing configuration for Passerby.

  Author(s): Connor Anderson
*/
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import About from "../features/test/About";

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
