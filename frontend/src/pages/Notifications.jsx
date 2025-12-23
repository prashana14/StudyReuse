import { useEffect, useState } from "react";
import API from "../services/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="container">
      <h2>Notifications</h2>
      {notifications.length === 0 && <p>No notifications yet.</p>}
      <ul>
        {notifications.map(n => (
          <li key={n._id} style={{ background: n.isRead ? "#f0f0f0" : "#d1e7dd", padding: "10px", marginBottom: "5px", borderRadius: "5px" }}>
            {n.message} 
            {!n.isRead && <button style={{ marginLeft: "10px" }} onClick={() => markRead(n._id)}>Mark as read</button>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
