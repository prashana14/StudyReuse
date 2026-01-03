import { useState, useEffect } from "react";
import API from "../../services/api";

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
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Send Notification</h1>
        <p className="text-gray-600 mt-2">
          Send system notifications to all users or specific users
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <span className="mr-2">⚠️</span>
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
          <span className="mr-2">✅</span>
          {success}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <form onSubmit={handleSubmit}>
          {/* Recipient Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-3">Send To</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={sendToAll}
                  onChange={() => setSendToAll(true)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">All Users</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!sendToAll}
                  onChange={() => setSendToAll(false)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Specific User</span>
              </label>
            </div>
          </div>

          {/* User Selection (if specific user) */}
          {!sendToAll && (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Select User</label>
              {loadingUsers ? (
                <div className="p-3 text-center text-gray-500">
                  Loading users...
                </div>
              ) : (
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              <p className="text-sm text-gray-500 mt-2">
                Users will receive this notification in their notification center
              </p>
            </div>
          )}

          {/* Notification Title */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Notification Title
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., System Update, Important Announcement, Item Approved"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              maxLength={100}
            />
            <p className="text-sm text-gray-500 mt-2">
              Clear, concise title that users will see first
            </p>
          </div>

          {/* Notification Message */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Message
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the notification message here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows="6"
              required
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">
                Be clear and informative. Users should understand the purpose.
              </p>
              <p className={`text-sm ${message.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                {message.length}/500 characters
              </p>
            </div>
          </div>

          {/* Preview (optional) */}
          {(title || message) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-gray-700 font-medium mb-3">Preview</label>
              <div className="bg-white p-4 rounded-lg border border-gray-300">
                <div className="font-semibold text-gray-800 mb-2">
                  {title || "(No title)"}
                </div>
                <div className="text-gray-600 whitespace-pre-wrap mb-3">
                  {message || "(No message)"}
                </div>
                <div className="text-xs text-gray-400 border-t border-gray-200 pt-2">
                  Sent by Admin • Just now
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (!sendToAll && loadingUsers)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending Notification...
              </>
            ) : (
              <>
                <span className="mr-2">📨</span>
                {sendToAll ? "Send to All Users" : "Send to Selected User"}
              </>
            )}
          </button>

          {/* Form Footer */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <span className="text-blue-500 mr-2">💡</span>
              <strong className="text-blue-800">Notification Tips</strong>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Keep messages clear and concise</p>
              <p>• Use for important announcements only</p>
              <p>• Test with a single user first if unsure</p>
              <p>• Notifications appear in user's notification center</p>
            </div>
          </div>
        </form>
      </div>

      {/* Recent Notifications Example */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Example Notifications</h3>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {/* Example 1 */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 mb-1">
                    System Maintenance
                  </div>
                  <div className="text-sm text-gray-600">
                    The platform will be temporarily unavailable on Sunday, 10 AM - 2 PM for scheduled maintenance.
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full whitespace-nowrap ml-2">
                  System
                </span>
              </div>
            </div>

            {/* Example 2 */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 mb-1">
                    Item Approved
                  </div>
                  <div className="text-sm text-gray-600">
                    Your item "Mathematics Textbook" has been approved and is now visible to other users.
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full whitespace-nowrap ml-2">
                  Item Update
                </span>
              </div>
            </div>

            {/* Example 3 */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 mb-1">
                    New Feature: Barter System
                  </div>
                  <div className="text-sm text-gray-600">
                    We've launched a new barter system! You can now trade items directly with other users.
                  </div>
                </div>
                <span className="px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full whitespace-nowrap ml-2">
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