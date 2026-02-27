/*
    File Name: useUser.ts

    Description: This custom hook provides an easy way to access the current user's authentication 
    and profile information from the UserContext. It abstracts away the useContext logic and ensures 
    that components using this hook are properly wrapped in a UserProvider.

    Author(s): Connor Anderson
*/


import { useContext } from "react";
import { UserContext } from "../contexts/UserContextData";

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
