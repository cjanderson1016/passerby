/*
  File Name: ProtectedRoute.tsx

  Description: Route guard component that requires authentication.
  Redirects unauthenticated users to the login page.

  Author(s): Connor Anderson
*/

import { Navigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";

// The props are defined as a single children prop that can be any React node.
// This allows us to wrap any component or set of components that we want to protect with this route guard.
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useUser();

  // if we are still loading the user data, we can show a loading indicator or return null to avoid rendering anything until we know the authentication status. This prevents flickering or showing protected content briefly before redirecting.
  if (loading) {
    return <div>Loading...</div>;
  }

  // if we are not loading and we do not have a user, it means the user is not authenticated. In this case, we redirect them to the home page ("/") where they can log in. The replace prop ensures that the navigation stack is replaced so that the user cannot go back to the protected page using the back button.
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // if we have a user and we are not loading, we can render the child components that are wrapped by this ProtectedRoute. This means that the user is authenticated and can access the protected content.
  return <>{children}</>;
}
