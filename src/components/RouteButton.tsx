// This is a simple reusable button component that uses React Router's
// useNavigate hook to programmatically navigate to different routes in the app.

import { useNavigate } from "react-router-dom";

type ButtonProps = {
  to: string;
  children: React.ReactNode;
};

export default function RouteButton({ to, children }: ButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      style={{
        padding: "0.5rem 1rem",
        cursor: "pointer",
        marginTop: "1rem",
      }}
    >
      {children}
    </button>
  );
}
