import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./admin.css";

const AdminLayout = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  // Redirect if not admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/" />;
  }
  
  const navItems = [
    { path: "/admin", label: "Dashboard", icon: "📊" },
    { path: "/admin/users", label: "Users", icon: "👥" },
    { path: "/admin/items", label: "Items", icon: "📦" },
    { path: "/admin/notifications", label: "Send Notification", icon: "🔔" },
  ];
  
  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>
            <span className="sidebar-icon">👑</span>
            Admin Panel
          </h2>
          <p className="admin-user-info">
            Logged in as: <strong>{user?.name}</strong>
          </p>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          
          <Link to="/" className="back-to-site">
            <span className="nav-icon">←</span>
            Back to Site
          </Link>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;