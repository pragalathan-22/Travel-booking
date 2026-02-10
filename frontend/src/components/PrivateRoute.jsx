import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function PrivateRoute() {
  const token = localStorage.getItem("token");

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    // Decode and verify token
    const decoded = jwtDecode(token);
    
    // Check if token is expired
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      localStorage.removeItem("token");
      return <Navigate to="/" replace />;
    }

    // Check if user is admin
    if (decoded.role !== "admin") {
      localStorage.removeItem("token");
      alert("Access denied. Admin privileges required.");
      return <Navigate to="/" replace />;
    }

    // Token is valid, render the protected route
    return <Outlet />;
  } catch (error) {
    // Invalid token
    localStorage.removeItem("token");
    return <Navigate to="/" replace />;
  }
}