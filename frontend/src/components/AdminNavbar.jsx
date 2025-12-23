import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import "./AdminNavbar.css";

const AdminNavbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="admin-navbar">
      <h2>Admin Panel</h2>
      <div className="admin-actions">
        <div className="notification" onClick={() => setOpen(!open)}>
          🔔
          {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
          {open && (
            <div className="dropdown">
              {notifications.length === 0 ? (
                <p>No notifications</p>
              ) : (
                notifications.map((n) => <p key={n._id}>{n.message}</p>)
              )}
            </div>
          )}
        </div>
        <span className="admin-name">{user.name}</span>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

export default AdminNavbar;
