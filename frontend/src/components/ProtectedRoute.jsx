import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  // Debug log
  console.log("ProtectedRoute - User:", user);
  console.log("ProtectedRoute - Checking access...");
  
  if (!user) {
    console.log("ProtectedRoute - No user, redirecting to login");
    return <Navigate to="/login" />;
  }
  
  console.log("ProtectedRoute - User exists, allowing access");
  return children;
};

export default ProtectedRoute;