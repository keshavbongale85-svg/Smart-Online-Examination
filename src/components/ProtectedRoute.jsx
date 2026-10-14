import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

// Guards routes. role="admin" restricts to admins; omit for any logged-in user.
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader full />;
  if (!user)
    return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role)
    return <Navigate to="/" replace />;

  return children;
}
