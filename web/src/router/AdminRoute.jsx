import { useAuth } from "@/shared/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading)
    return <div style={{ padding: "20px" }}>Verifying permissions...</div>;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
