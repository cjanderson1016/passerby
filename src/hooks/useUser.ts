/*
    File Name: useUser.ts

    Description: This custom hook provides an easy way to access the current user's authentication 
    and profile information from the UserContext. It abstracts away the useContext logic and ensures 
    that components using this hook are properly wrapped in a UserProvider.

    Author(s): Connor Anderson
*/


import { useContext } from "react"; // import the useContext hook from React to access the UserContext
import { UserContext } from "../contexts/UserContextData"; // import the UserContext object we defined in UserContextData.ts -- it contains the supabase auth user, the additional profile info we fetch from our public.users table, it if the context is loading

// This custom hook allows components to easily access the user context data (authenticated user, profile info from public.users table, and the loading state) without needing to import useContext and UserContext in every component. It also ensures that the hook is used within a UserProvider, otherwise it will throw an error.
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
