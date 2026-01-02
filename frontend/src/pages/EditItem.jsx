import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../services/api"; // Import apiService
import { useAuth } from "../context/AuthContext";

const EditItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "good",
    imageFile: null, // CHANGED: Renamed from image to imageFile
    imagePreview: "",
  });

  const categories = [
    "Study Guides",
    "Textbooks", 
    "Stationery",
    "Lab Equipment",
    "Electronics",
    "Furniture",
    "Other"
  ];

  const conditions = [
    { value: "new", label: "Brand New" },
    { value: "like_new", label: "Like New" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "needs_repair", label: "Needs Repair" }
  ];

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        // CHANGED: Use apiService.items.getById()
        const response = await apiService.items.getById(id);
        const item = response.data.data || response.data;
        
        setFormData({
          title: item.title || "",
          description: item.description || "",
          price: item.price || "",
          category: item.category || "",
          condition: item.condition || "good",
          imageFile: null, // Keep null, we'll use imagePreview for existing image
          imagePreview: item.imageURL || item.image || "", // Cloudinary URL
        });
      } catch (err) {
        console.error("Error fetching item:", err);
        setError("Failed to load item. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchItem();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Use apiService helper for validation
    const validation = apiService.helpers.validateImageFile(file);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    setFormData(prev => ({
      ...prev,
      imageFile: file, // CHANGED: Store as imageFile
      imagePreview: URL.createObjectURL(file)
    }));
    
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    
    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }
    
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      setError("Please enter a valid price");
      return;
    }
    
    if (!formData.category) {
      setError("Please select a category");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      console.log("Updating item with:", {
        id,
        title: formData.title,
        price: parseFloat(formData.price),
        hasNewImage: !!formData.imageFile
      });

      // 🔥 UPDATED: Use apiService.items.update() with FormData
      // Pass the existing form data and optional new image file
      const response = await apiService.items.update(
        id,
        {
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: formData.price,
          category: formData.category,
          condition: formData.condition,
        },
        formData.imageFile // Pass the image file (or null if no new image)
      );

      console.log("✅ Cloudinary update successful:", response.data);
      setSuccess(response.data.message || "Item updated successfully!");
      
      // Redirect after delay
      setTimeout(() => {
        navigate(`/item/${id}`);
      }, 2000);
      
    } catch (err) {
      console.error("❌ Error updating item:", err);
      
      // Handle specific error types
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 400) {
        const errorData = err.response?.data;
        
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          setError(`Validation Error: ${errorData.errors.join(", ")}`);
        } else if (errorData?.message) {
          setError(`Error: ${errorData.message}`);
        } else {
          setError("Bad Request. Please check all fields.");
        }
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message === "Network Error") {
        setError("Cannot connect to server. Please check if backend is running.");
      } else if (err.message.includes("File too large")) {
        setError("Image too large. Maximum size is 5MB.");
      } else if (err.message.includes("Invalid image format")) {
        setError("Invalid image format. Use JPG, PNG, GIF, or WEBP.");
      } else {
        setError("Failed to update item. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: ""
    }));
    
    // Clear file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: "800px",
        margin: "60px auto",
        textAlign: "center",
        padding: "40px"
      }}>
        <div style={{
          margin: "0 auto",
          width: "50px",
          height: "50px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #4361ee",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <p style={{
          marginTop: "20px",
          color: "#6c757d",
          fontSize: "16px"
        }}>
          Loading item details...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: "900px",
      margin: "40px auto",
      padding: "0 20px"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "40px"
      }}>
        <div>
          <h1 style={{
            fontSize: "2.2rem",
            marginBottom: "8px",
            color: "#212529"
          }}>
            Edit Item
          </h1>
          <p style={{
            color: "#6c757d",
            fontSize: "16px"
          }}>
            Update your item details and images
          </p>
        </div>
        
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "12px 24px",
            background: "transparent",
            border: "2px solid #4361ee",
            color: "#4361ee",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#4361ee";
            e.target.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
            e.target.style.color = "#4361ee";
          }}
        >
          ← Go Back
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div style={{
          padding: "16px 20px",
          background: "linear-gradient(135deg, #ff6b6b, #e63946)",
          color: "white",
          borderRadius: "10px",
          marginBottom: "30px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          animation: "fadeIn 0.3s ease"
        }}>
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <span style={{ flex: 1 }}>{error}</span>
          <button 
            onClick={() => setError("")}
            style={{ 
              background: "none", 
              border: "none", 
              color: "white", 
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
              transition: "background 0.3s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div style={{
          padding: "16px 20px",
          background: "linear-gradient(135deg, #38b000, #2d9100)",
          color: "white",
          borderRadius: "10px",
          marginBottom: "30px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          animation: "fadeIn 0.3s ease"
        }}>
          <span style={{ fontSize: "20px" }}>✅</span>
          <span style={{ flex: 1 }}>{success}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{
        background: "white",
        borderRadius: "12px",
        padding: "40px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
          marginBottom: "40px"
        }}>
          {/* Left Column - Image Upload */}
          <div>
            <h3 style={{
              fontSize: "18px",
              marginBottom: "20px",
              color: "#212529"
            }}>
              Item Image
            </h3>
            
            <div
              onClick={() => document.getElementById("image-upload").click()}
              style={{
                width: "100%",
                height: "300px",
                border: formData.imagePreview ? "none" : "2px dashed #dee2e6",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
                transition: "all 0.3s",
                background: formData.imagePreview 
                  ? `url(${formData.imagePreview}) center/cover no-repeat`
                  : "#f8f9fa"
              }}
              onMouseEnter={(e) => {
                if (!formData.imagePreview) {
                  e.target.style.borderColor = "#4361ee";
                  e.target.style.background = "#f0f4ff";
                }
              }}
              onMouseLeave={(e) => {
                if (!formData.imagePreview) {
                  e.target.style.borderColor = "#dee2e6";
                  e.target.style.background = "#f8f9fa";
                }
              }}
            >
              {!formData.imagePreview ? (
                <>
                  <div style={{
                    width: "50px",
                    height: "50px",
                    background: "#4361ee",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px"
                  }}>
                    <span style={{ fontSize: "20px", color: "white" }}>📷</span>
                  </div>
                  <p style={{
                    color: "#4361ee",
                    fontWeight: "600",
                    marginBottom: "8px"
                  }}>
                    Click to upload image
                  </p>
                  <p style={{
                    color: "#6c757d",
                    fontSize: "14px"
                  }}>
                    JPG, PNG, GIF, WEBP (Max 5MB)
                  </p>
                </>
              ) : (
                <div style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  background: "rgba(0,0,0,0.7)",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "500"
                }}>
                  {formData.imageFile ? "New Image" : "Current Image"}
                </div>
              )}
            </div>
            
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
            
            {formData.imagePreview && (
              <div style={{
                display: "flex",
                gap: "10px",
                marginTop: "15px"
              }}>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#ff6b6b",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#e63946";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#ff6b6b";
                  }}
                >
                  {formData.imageFile ? "Cancel New Image" : "Remove Image"}
                </button>
              </div>
            )}
            
            {formData.imageFile && (
              <div style={{
                marginTop: "10px",
                padding: "10px",
                background: "#eef2ff",
                borderRadius: "6px",
                borderLeft: "4px solid #4361ee"
              }}>
                <p style={{
                  fontSize: "14px",
                  color: "#4361ee",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span>📸</span>
                  <span>New image selected: {formData.imageFile.name}</span>
                </p>
                <p style={{
                  fontSize: "12px",
                  color: "#6c757d",
                  margin: "4px 0 0 0"
                }}>
                  Size: {(formData.imageFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Form Fields */}
          <div>
            <h3 style={{
              fontSize: "18px",
              marginBottom: "20px",
              color: "#212529"
            }}>
              Item Details
            </h3>

            <div style={{ marginBottom: "25px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#495057"
              }}>
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Calculus Textbook, Engineering Calculator"
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  fontSize: "16px",
                  transition: "all 0.3s"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4361ee";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#dee2e6";
                }}
                required
              />
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#495057"
              }}>
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your item in detail..."
                rows="4"
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  fontSize: "16px",
                  resize: "vertical",
                  transition: "all 0.3s",
                  minHeight: "100px"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4361ee";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#dee2e6";
                }}
                required
              />
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "20px",
              marginBottom: "25px"
            }}>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#495057"
                }}>
                  Price (Rs.) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "1px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "all 0.3s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4361ee";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#dee2e6";
                  }}
                  required
                />
              </div>

              <div>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#495057"
                }}>
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "1px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    background: "white",
                    cursor: "pointer",
                    transition: "all 0.3s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4361ee";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#dee2e6";
                  }}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#495057"
              }}>
                Condition *
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {conditions.map(cond => (
                  <label
                    key={cond.value}
                    style={{
                      flex: "1",
                      minWidth: "110px",
                      padding: "14px",
                      border: `1px solid ${
                        formData.condition === cond.value ? "#4361ee" : "#dee2e6"
                      }`,
                      borderRadius: "6px",
                      background: formData.condition === cond.value 
                        ? "#f0f4ff" 
                        : "white",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      textAlign: "center"
                    }}
                    onMouseEnter={(e) => {
                      if (formData.condition !== cond.value) {
                        e.target.style.borderColor = "#4361ee";
                        e.target.style.background = "#f8f9fa";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (formData.condition !== cond.value) {
                        e.target.style.borderColor = "#dee2e6";
                        e.target.style.background = "white";
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={cond.value}
                      checked={formData.condition === cond.value}
                      onChange={handleChange}
                      style={{ display: "none" }}
                    />
                    <div style={{ 
                      fontSize: "12px", 
                      fontWeight: "600",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      {cond.value === "new" && "NEW"}
                      {cond.value === "like_new" && "LIKE NEW"}
                      {cond.value === "good" && "GOOD"}
                      {cond.value === "fair" && "FAIR"}
                      {cond.value === "needs_repair" && "REPAIR"}
                    </div>
                    <span style={{
                      fontSize: "14px",
                      color: formData.condition === cond.value 
                        ? "#4361ee" 
                        : "#495057"
                    }}>
                      {cond.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "30px",
          borderTop: "1px solid #dee2e6"
        }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: "12px 24px",
              background: "transparent",
              border: "1px solid #6c757d",
              color: "#6c757d",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#6c757d";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
              e.target.style.color = "#6c757d";
            }}
          >
            Cancel
          </button>
          
          <div style={{ display: "flex", gap: "15px" }}>
            <button
              type="button"
              onClick={() => navigate(`/item/${id}`)}
              style={{
                padding: "12px 24px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#495057";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#6c757d";
              }}
            >
              Preview
            </button>
            
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "12px 32px",
                background: saving 
                  ? "#94d82d" 
                  : "linear-gradient(135deg, #4361ee, #7209b7)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                opacity: saving ? 0.8 : 1
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(67, 97, 238, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    border: "2px solid white",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    marginRight: "8px",
                    animation: "spin 1s linear infinite",
                    verticalAlign: "middle"
                  }}></div>
                  Saving...
                </>
              ) : (
                "Update Item"
              )}
            </button>
          </div>
        </div>
      </form>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default EditItem;