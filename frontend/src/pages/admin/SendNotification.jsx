import { useState, useEffect } from "react";
import API from "../../services/api";
import "./admin.css";

const SendNotification = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [sendToAll, setSendToAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users for dropdown
  useEffect(() => {
    if (!sendToAll) {
      fetchUsers();
    }
  }, [sendToAll]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await API.get("/admin/users?limit=100");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users list.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      setError("Please enter both title and message");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!sendToAll && !userId.trim()) {
      setError("Please select a user or switch to 'All Users'");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        ...(!sendToAll && { userId: userId.trim() })
      };
      
      await API.post("/admin/notifications/send", payload);
      
      setSuccess(
        sendToAll 
          ? "Notification sent to all users successfully!" 
          : "Notification sent to selected user successfully!"
      );
      
      // Reset form
      setTitle("");
      setMessage("");
      setUserId("");
      setSendToAll(true);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Error sending notification:", err);
      setError(err.response?.data?.message || "Failed to send notification. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>Send Notification</h1>
        <p className="page-description">
          Send system notifications to all users or specific users
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-message">
          <span style={{ marginRight: "8px" }}>❌</span>
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <span style={{ marginRight: "8px" }}>✅</span>
          {success}
        </div>
      )}

      {/* Form */}
      <div className="admin-form">
        <form onSubmit={handleSubmit}>
          {/* Recipient Selection */}
          <div className="form-group">
            <label className="form-label">Send To</label>
            <div className="form-radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  checked={sendToAll}
                  onChange={() => setSendToAll(true)}
                />
                <span>All Users</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  checked={!sendToAll}
                  onChange={() => setSendToAll(false)}
                />
                <span>Specific User</span>
              </label>
            </div>
          </div>

          {/* User Selection (if specific user) */}
          {!sendToAll && (
            <div className="form-group">
              <label className="form-label">Select User</label>
              {loadingUsers ? (
                <div style={{ padding: "12px", textAlign: "center", color: "#64748b" }}>
                  Loading users...
                </div>
              ) : (
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="form-select"
                  required={!sendToAll}
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email}) {user.isBlocked ? " [Blocked]" : ""}
                    </option>
                  ))}
                </select>
              )}
              <span className="form-hint">
                Users will receive this notification in their notification center
              </span>
            </div>
          )}

          {/* Notification Title */}
          <div className="form-group">
            <label className="form-label">
              Notification Title
              <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., System Update, Important Announcement, Item Approved"
              className="form-input"
              required
              maxLength={100}
            />
            <span className="form-hint">
              Clear, concise title that users will see first
            </span>
          </div>

          {/* Notification Message */}
          <div className="form-group">
            <label className="form-label">
              Message
              <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the notification message here..."
              className="form-textarea"
              rows="6"
              required
              maxLength={500}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span className="form-hint">
                Be clear and informative. Users should understand the purpose.
              </span>
              <span className="form-hint" style={{ color: message.length > 450 ? "#ef4444" : "#6b7280" }}>
                {message.length}/500 characters
              </span>
            </div>
          </div>

          {/* Preview (optional) */}
          {(title || message) && (
            <div className="form-group">
              <label className="form-label">Preview</label>
              <div style={{
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "14px"
              }}>
                <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>
                  {title || "(No title)"}
                </div>
                <div style={{ color: "#475569", whiteSpace: "pre-wrap" }}>
                  {message || "(No message)"}
                </div>
                <div style={{ 
                  fontSize: "12px", 
                  color: "#94a3b8", 
                  marginTop: "12px",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "8px"
                }}>
                  Sent by Admin • Just now
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (!sendToAll && loadingUsers)}
            className="btn-submit"
          >
            {loading ? (
              <>
                <span style={{ marginRight: "8px" }}>⏳</span>
                Sending Notification...
              </>
            ) : (
              <>
                <span style={{ marginRight: "8px" }}>📨</span>
                {sendToAll ? "Send to All Users" : "Send to Selected User"}
              </>
            )}
          </button>

          {/* Form Footer */}
          <div style={{ 
            textAlign: "center", 
            marginTop: "20px",
            padding: "16px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px dashed #cbd5e1"
          }}>
            <div style={{ fontSize: "14px", color: "#475569", marginBottom: "8px" }}>
              <span style={{ marginRight: "8px" }}>💡</span>
              <strong>Notification Tips</strong>
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
              • Keep messages clear and concise<br/>
              • Use for important announcements only<br/>
              • Test with a single user first if unsure<br/>
              • Notifications appear in user's notification center
            </div>
          </div>
        </form>
      </div>

      {/* Recent Notifications Example */}
      <div className="card" style={{ marginTop: "30px" }}>
        <div className="card-header">
          <h3>Example Notifications</h3>
        </div>
        <div className="card-content">
          <div style={{ display: "grid", gap: "16px" }}>
            {/* Example 1 */}
            <div style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>
                    System Maintenance
                  </div>
                  <div style={{ fontSize: "13px", color: "#475569" }}>
                    The platform will be temporarily unavailable on Sunday, 10 AM - 2 PM for scheduled maintenance.
                  </div>
                </div>
                <span className="badge" style={{ background: "#3b82f6", color: "white" }}>
                  System
                </span>
              </div>
            </div>

            {/* Example 2 */}
            <div style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>
                    Item Approved
                  </div>
                  <div style={{ fontSize: "13px", color: "#475569" }}>
                    Your item "Mathematics Textbook" has been approved and is now visible to other users.
                  </div>
                </div>
                <span className="badge" style={{ background: "#10b981", color: "white" }}>
                  Item Update
                </span>
              </div>
            </div>

            {/* Example 3 */}
            <div style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>
                    New Feature: Barter System
                  </div>
                  <div style={{ fontSize: "13px", color: "#475569" }}>
                    We've launched a new barter system! You can now trade items directly with other users.
                  </div>
                </div>
                <span className="badge" style={{ background: "#8b5cf6", color: "white" }}>
                  Feature Update
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendNotification;