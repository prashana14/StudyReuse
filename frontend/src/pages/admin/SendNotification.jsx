import { useState, useEffect } from "react";
import API from "../../services/api";
import { 
  Send, 
  Users, 
  User, 
  Bell, 
  AlertCircle,
  Type,
  MessageSquare,
  Eye,
  X
} from "lucide-react";

const SendNotification = () => {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    recipientType: "all", // "all", "user"
    userId: ""
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (formData.recipientType === "user") {
      fetchUsers();
    }
  }, [formData.recipientType]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await API.get("/admin/users?limit=100");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users list");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError("Title and message are required");
      return;
    }

    if (formData.recipientType === "user" && !formData.userId) {
      setError("Please select a user");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        userType: formData.recipientType === "all" ? "all" : undefined,
        userId: formData.recipientType === "user" ? formData.userId : undefined
      };
      
      await API.post("/admin/notifications/send", payload);
      
      setSuccess(
        formData.recipientType === "all" 
          ? "Notification sent to all users successfully!" 
          : "Notification sent to selected user successfully!"
      );
      
      // Reset form
      setFormData({
        title: "",
        message: "",
        recipientType: "all",
        userId: ""
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Error sending notification:", err);
      setError(err.response?.data?.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const notificationExamples = [
    {
      title: "System Maintenance",
      message: "The platform will be temporarily unavailable on Sunday from 10 AM to 2 PM for scheduled maintenance.",
      type: "system"
    },
    {
      title: "Item Approved",
      message: "Your item 'Mathematics Textbook' has been approved and is now visible to other users.",
      type: "item"
    },
    {
      title: "New Feature Alert",
      message: "We've launched a new barter system! You can now trade items directly with other users.",
      type: "feature"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Send Notification</h1>
        <p className="text-gray-600 mt-2">Send system notifications to users</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-600 hover:text-red-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess("")} className="text-green-600 hover:text-green-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Recipient Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Send To
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, recipientType: "all", userId: "" }));
                      setError("");
                    }}
                    className={`p-4 border rounded-lg flex flex-col items-center justify-center ${
                      formData.recipientType === "all" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Users className={`w-8 h-8 mb-2 ${
                      formData.recipientType === "all" ? "text-blue-600" : "text-gray-400"
                    }`} />
                    <span className="font-medium">All Users</span>
                    <span className="text-sm text-gray-500 mt-1">Broadcast to everyone</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, recipientType: "user" }));
                      setError("");
                    }}
                    className={`p-4 border rounded-lg flex flex-col items-center justify-center ${
                      formData.recipientType === "user" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <User className={`w-8 h-8 mb-2 ${
                      formData.recipientType === "user" ? "text-blue-600" : "text-gray-400"
                    }`} />
                    <span className="font-medium">Specific User</span>
                    <span className="text-sm text-gray-500 mt-1">Send to individual</span>
                  </button>
                </div>
              </div>

              {/* User Selection */}
              {formData.recipientType === "user" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User
                  </label>
                  {loadingUsers ? (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading users...</p>
                    </div>
                  ) : (
                    <select
                      name="userId"
                      value={formData.userId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required={formData.recipientType === "user"}
                    >
                      <option value="">Select a user...</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email}) {user.isBlocked ? " [Blocked]" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Type className="w-4 h-4 mr-2" />
                    Notification Title
                  </div>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., System Update, Important Announcement"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                  maxLength={100}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">Clear and concise title</p>
                  <p className="text-xs text-gray-500">{formData.title.length}/100</p>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </div>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Enter the notification message here. Be clear and informative..."
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  required
                  maxLength={500}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">Users will see this in their notification center</p>
                  <p className={`text-xs ${formData.message.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                    {formData.message.length}/500
                  </p>
                </div>
              </div>

              {/* Preview */}
              {(formData.title || formData.message) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Eye className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Preview</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {formData.title || "(No title)"}
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {formData.message || "(No message)"}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500">System Notification</span>
                      <span className="text-xs text-gray-500">Just now</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {formData.recipientType === "all" ? "Send to All Users" : "Send to Selected User"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Examples & Tips */}
        <div className="space-y-6">
          {/* Tips Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Bell className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Notification Tips</h3>
            </div>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-2"></div>
                Keep messages clear and concise
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-2"></div>
                Use for important announcements only
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-2"></div>
                Test with a single user first if unsure
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-2"></div>
                Include clear call-to-action when needed
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-2"></div>
                Avoid sending too many notifications
              </li>
            </ul>
          </div>

          {/* Examples Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Example Notifications</h3>
            <div className="space-y-4">
              {notificationExamples.map((example, index) => (
                <div 
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      title: example.title,
                      message: example.message
                    });
                    setError("");
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{example.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      example.type === 'system' ? 'bg-blue-100 text-blue-800' :
                      example.type === 'item' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {example.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{example.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-semibold mb-4">Notification Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Sent Today</span>
                <span className="font-bold">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Total Users</span>
                <span className="font-bold">1,247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Read Rate</span>
                <span className="font-bold">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Avg. Response Time</span>
                <span className="font-bold">15min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendNotification;