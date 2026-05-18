import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--cream)" }}
      >
        <p
          className="text-sm"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {"> authenticating"}
          <span
            className="cursor-blink"
            style={{ color: "var(--green)" }}
          >
            _
          </span>
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
