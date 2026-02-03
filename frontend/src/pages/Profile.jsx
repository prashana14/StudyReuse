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
    joinYear: ""
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
          // Get join year from user data or use current year
          let joinYear = "";
          if (storedUser.createdAt) {
            const date = new Date(storedUser.createdAt);
            joinYear = date.getFullYear().toString();
          } else if (storedUser.joinedDate) {
            // Try to extract year from joinedDate string
            const yearMatch = storedUser.joinedDate.match(/\d{4}/);
            joinYear = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
          } else {
            // If no join date in data, use current year
            joinYear = new Date().getFullYear().toString();
          }
          
          setProfileData({
            name: storedUser.name || "",
            email: storedUser.email || "",
            joinedDate: `Since ${joinYear}`,
            joinYear: joinYear
          });
          
          setFormData({
            name: storedUser.name || "",
            email: storedUser.email || ""
          });
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
      <div style={{ maxWidth: "1200px", margin: "40px auto", textAlign: "center", padding: "60px" }}>
        <div style={{ 
          margin: "0 auto", 
          width: "50px", 
          height: "50px", 
          border: "4px solid #e0e0e0",
          borderTop: "4px solid #4361ee",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <p style={{ marginTop: "20px", color: "#6c757d" }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ 
          fontSize: "2.5rem", 
          marginBottom: "16px",
          background: "linear-gradient(135deg, #4361ee, #7209b7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontWeight: "700"
        }}>
          My Profile
        </h1>
        <p style={{ color: "#6c757d", fontSize: "1.125rem" }}>
          Manage your account information and settings
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "30px" }}>
        {/* Sidebar - Profile Card */}
        <div style={{ 
          background: "white",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
          height: "fit-content"
        }}>
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
            <h2 style={{ marginBottom: "8px", fontSize: "1.5rem", color: "#212529" }}>{profileData.name}</h2>
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
              {profileData.joinedDate}
            </span>
          </div>

          {/* Simple Stats - Just for visual */}
          <div style={{ 
            borderTop: "1px solid #f0f0f0", 
            paddingTop: "20px",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "10px"
          }}>
            <div style={{ 
              background: "#f8f9fa",
              padding: "12px",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#4361ee" }}>
                {profileData.joinYear}
              </div>
              <div style={{ fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
                Joined Year
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div>
          {/* Account Settings Card */}
          <div style={{ 
            background: "white",
            borderRadius: "12px",
            padding: "30px",
            marginBottom: "30px",
            boxShadow: "0 2px 20px rgba(0,0,0,0.08)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#212529", fontWeight: "600" }}>Account Settings</h2>
              {!editMode ? (
                <button 
                  onClick={() => setEditMode(true)}
                  style={{ 
                    padding: "10px 20px",
                    border: "2px solid #4361ee",
                    background: "transparent",
                    borderRadius: "8px",
                    color: "#4361ee",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#eef2ff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                  }}
                >
                  Edit Profile
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
                    style={{ 
                      padding: "10px 20px",
                      border: "2px solid #6c757d",
                      background: "transparent",
                      borderRadius: "8px",
                      color: "#6c757d",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "all 0.3s"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#f8f9fa";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    style={{ 
                      padding: "10px 20px",
                      border: "none",
                      background: "linear-gradient(135deg, #4361ee, #7209b7)",
                      borderRadius: "8px",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "all 0.3s"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 4px 15px rgba(67, 97, 238, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {editMode ? (
              <div style={{ display: "grid", gap: "20px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    color: "#495057",
                    fontSize: "14px",
                    fontWeight: "600"
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      transition: "all 0.3s",
                      outline: "none"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4361ee";
                      e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e0e0e0";
                      e.target.style.boxShadow = "none";
                    }}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    color: "#495057",
                    fontSize: "14px",
                    fontWeight: "600"
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      transition: "all 0.3s",
                      outline: "none"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4361ee";
                      e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e0e0e0";
                      e.target.style.boxShadow = "none";
                    }}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "20px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    color: "#6c757d", 
                    fontSize: "14px"
                  }}>
                    Full Name
                  </label>
                  <p style={{ fontSize: "18px", fontWeight: "500", color: "#212529" }}>{profileData.name}</p>
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    color: "#6c757d", 
                    fontSize: "14px"
                  }}>
                    Email Address
                  </label>
                  <p style={{ fontSize: "18px", fontWeight: "500", color: "#212529" }}>{profileData.email}</p>
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    color: "#6c757d", 
                    fontSize: "14px"
                  }}>
                    Member Since
                  </label>
                  <p style={{ fontSize: "18px", fontWeight: "500", color: "#212529" }}>{profileData.joinedDate}</p>
                </div>
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div style={{ 
            background: "white",
            borderRadius: "12px",
            padding: "30px",
            marginBottom: "30px",
            boxShadow: "0 2px 20px rgba(0,0,0,0.08)"
          }}>
            <h2 style={{ marginBottom: "30px", fontSize: "1.5rem", color: "#212529", fontWeight: "600" }}>Security</h2>
            <div style={{ display: "grid", gap: "20px" }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "20px",
                border: "1px solid #e0e0e0",
                borderRadius: "10px",
                background: "#f8f9fa"
              }}>
                <div>
                  <h3 style={{ marginBottom: "8px", fontSize: "16px", color: "#212529", fontWeight: "600" }}>Change Password</h3>
                  <p style={{ color: "#6c757d", fontSize: "14px" }}>Password change feature is under development</p>
                </div>
                <div style={{ 
                  padding: "6px 12px",
                  background: "#fff3cd",
                  color: "#856404",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <span>⏳</span>
                  <span>Coming Soon</span>
                </div>
              </div>
              
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "20px",
                border: "1px solid #e0e0e0",
                borderRadius: "10px",
                background: "#f8f9fa"
              }}>
                <div>
                  <h3 style={{ marginBottom: "8px", fontSize: "16px", color: "#212529", fontWeight: "600" }}>Two-Factor Authentication</h3>
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
          <div style={{ 
            background: "#fff5f5",
            borderRadius: "12px",
            padding: "30px", 
            border: "2px solid #ffebee",
            boxShadow: "0 2px 20px rgba(0,0,0,0.08)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{
                width: "32px",
                height: "32px",
                background: "#e63946",
                color: "white",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px"
              }}>
                ⚠️
              </div>
              <h2 style={{ margin: 0, color: "#e63946", fontSize: "1.5rem", fontWeight: "600" }}>Danger Zone</h2>
            </div>
            <p style={{ color: "#721c24", marginBottom: "20px", fontSize: "14px", lineHeight: "1.5" }}>
              These actions are irreversible and will permanently affect your account. 
              Please proceed with caution.
            </p>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <button 
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete your account? 
This action cannot be undone. 
All your data since ${profileData.joinYear} will be permanently lost.`)) {
                    // Handle account deletion
                    logout();
                    navigate("/");
                  }
                }}
                style={{ 
                  background: "#e63946",
                  color: "white",
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 15px rgba(230, 57, 70, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <span>🗑️</span>
                <span>Delete Account</span>
              </button>
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to logout?")) {
                    logout();
                    navigate("/");
                  }
                }}
                style={{ 
                  border: "2px solid #e63946",
                  background: "transparent",
                  color: "#e63946",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#ffe6e6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                }}
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 900px) {
          .profile-container {
            grid-template-columns: 1fr !important;
          }
          
          .profile-sidebar {
            order: 2;
          }
          
          .profile-main {
            order: 1;
          }
        }
        
        @media (max-width: 600px) {
          .danger-zone-buttons {
            flex-direction: column;
          }
          
          .danger-zone-buttons button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;