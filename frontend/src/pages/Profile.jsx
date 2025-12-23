import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    joinedDate: "",
    totalItems: 0,
    activeBarters: 0,
    completedTrades: 0
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Get user data from context/localStorage
        const storedUser = JSON.parse(localStorage.getItem("user")) || user;
        
        if (storedUser) {
          setProfileData({
            name: storedUser.name || "",
            email: storedUser.email || "",
            joinedDate: "2024", // You should store join date in your user model
            totalItems: 0,
            activeBarters: 0,
            completedTrades: 0
          });
          
          setFormData({
            name: storedUser.name || "",
            email: storedUser.email || ""
          });

          // Fetch user stats
          try {
            const itemsRes = await API.get("/items/my");
            const barterRes = await API.get("/barter/my");
            
            if (itemsRes.data) {
              setProfileData(prev => ({
                ...prev,
                totalItems: itemsRes.data.length
              }));
            }
            
            if (barterRes.data) {
              const active = barterRes.data.filter(b => b.status === "pending").length;
              const completed = barterRes.data.filter(b => b.status === "accepted").length;
              
              setProfileData(prev => ({
                ...prev,
                activeBarters: active,
                completedTrades: completed
              }));
            }
          } catch (err) {
            console.log("Could not fetch stats:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Update user profile (you'll need to create this API endpoint)
      // await API.put("/users/profile", formData);
      
      // Update local storage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      setProfileData(prev => ({
        ...prev,
        name: formData.name,
        email: formData.email
      }));
      
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: "1200px", margin: "40px auto", textAlign: "center", padding: "60px" }}>
        <div className="loading" style={{ margin: "0 auto", width: "50px", height: "50px", borderWidth: "4px" }}></div>
        <p style={{ marginTop: "20px", color: "#6c757d" }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "40px auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ 
          fontSize: "2.5rem", 
          marginBottom: "16px",
          background: "linear-gradient(135deg, #4361ee, #7209b7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          My Profile
        </h1>
        <p style={{ color: "#6c757d", fontSize: "1.125rem" }}>
          Manage your account information and track your activity
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "30px" }}>
        {/* Sidebar - Profile Card */}
        <div className="card" style={{ padding: "30px", height: "fit-content" }}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4361ee, #7209b7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "48px",
              fontWeight: "bold",
              margin: "0 auto 20px"
            }}>
              {profileData.name ? profileData.name.charAt(0).toUpperCase() : "U"}
            </div>
            <h2 style={{ marginBottom: "8px" }}>{profileData.name}</h2>
            <p style={{ color: "#6c757d", marginBottom: "20px" }}>{profileData.email}</p>
            <span style={{
              display: "inline-block",
              background: "#eef2ff",
              color: "#4361ee",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              Member since {profileData.joinedDate}
            </span>
          </div>

          <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <span style={{ color: "#6c757d" }}>Total Items</span>
              <span style={{ fontWeight: "600" }}>{profileData.totalItems}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <span style={{ color: "#6c757d" }}>Active Barters</span>
              <span style={{ fontWeight: "600" }}>{profileData.activeBarters}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <span style={{ color: "#6c757d" }}>Completed Trades</span>
              <span style={{ fontWeight: "600" }}>{profileData.completedTrades}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div>
          {/* Account Settings Card */}
          <div className="card" style={{ padding: "30px", marginBottom: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h2 style={{ margin: 0 }}>Account Settings</h2>
              {!editMode ? (
                <button 
                  onClick={() => setEditMode(true)}
                  className="btn btn-outline"
                  style={{ padding: "10px 20px" }}
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        name: profileData.name,
                        email: profileData.email
                      });
                    }}
                    className="btn btn-outline"
                    style={{ padding: "10px 20px" }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="btn btn-primary"
                    style={{ padding: "10px 20px" }}
                  >
                    💾 Save Changes
                  </button>
                </div>
              )}
            </div>

            {editMode ? (
              <div style={{ display: "grid", gap: "20px" }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "#6c757d", fontSize: "14px" }}>
                    Full Name
                  </label>
                  <p style={{ fontSize: "18px", fontWeight: "500" }}>{profileData.name}</p>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "#6c757d", fontSize: "14px" }}>
                    Email Address
                  </label>
                  <p style={{ fontSize: "18px", fontWeight: "500" }}>{profileData.email}</p>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "#6c757d", fontSize: "14px" }}>
                    Account Type
                  </label>
                  <p style={{ fontSize: "18px", fontWeight: "500" }}>Student Account</p>
                </div>
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div className="card" style={{ padding: "30px", marginBottom: "30px" }}>
            <h2 style={{ marginBottom: "30px" }}>Security</h2>
            <div style={{ display: "grid", gap: "20px" }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "20px",
                border: "1px solid #e0e0e0",
                borderRadius: "10px"
              }}>
                <div>
                  <h3 style={{ marginBottom: "8px", fontSize: "16px" }}>Change Password</h3>
                  <p style={{ color: "#6c757d", fontSize: "14px" }}>Update your password regularly</p>
                </div>
                <button 
                  className="btn btn-outline"
                  style={{ padding: "10px 20px" }}
                  onClick={() => navigate("/change-password")}
                >
                  Change
                </button>
              </div>
              
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "20px",
                border: "1px solid #e0e0e0",
                borderRadius: "10px"
              }}>
                <div>
                  <h3 style={{ marginBottom: "8px", fontSize: "16px" }}>Two-Factor Authentication</h3>
                  <p style={{ color: "#6c757d", fontSize: "14px" }}>Add an extra layer of security</p>
                </div>
                <span style={{
                  padding: "6px 12px",
                  background: "#eef2ff",
                  color: "#4361ee",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "500"
                }}>
                  Not Enabled
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card" style={{ 
            padding: "30px", 
            border: "2px solid #ffebee",
            background: "#fff5f5"
          }}>
            <h2 style={{ marginBottom: "20px", color: "#e63946" }}>⚠️ Danger Zone</h2>
            <p style={{ color: "#6c757d", marginBottom: "20px" }}>
              These actions are irreversible. Please proceed with caution.
            </p>
            <div style={{ display: "flex", gap: "20px" }}>
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                    // Handle account deletion
                    logout();
                    navigate("/");
                  }
                }}
                className="btn"
                style={{ 
                  background: "#e63946",
                  color: "white",
                  padding: "12px 24px"
                }}
              >
                🗑️ Delete Account
              </button>
              <button 
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="btn btn-outline"
                style={{ 
                  borderColor: "#e63946",
                  color: "#e63946",
                  padding: "12px 24px"
                }}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;