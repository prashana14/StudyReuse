import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../services/api";
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
    image: null,
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
        const res = await apiService.get(`/items/${id}`);
        const item = res.data;
        
        setFormData({
          title: item.title || "",
          description: item.description || "",
          price: item.price || "",
          category: item.category || "",
          condition: item.condition || "good",
          image: null,
          imagePreview: item.imageURL || item.image || "",
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
    // Clear any previous errors/success messages
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Please select a valid image file (JPG, PNG, WEBP)");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
      
      if (error) setError("");
      if (success) setSuccess("");
    }
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
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("condition", formData.condition);
      
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      await apiService.put(`/items/${id}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        }
      });

      setSuccess("Item updated successfully!");
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/item/${id}`);
      }, 2000);
      
    } catch (err) {
      console.error("Error updating item:", err);
      setError(err.response?.data?.message || "Failed to update item. Please try again.");
    } finally {
      setSaving(false);
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
            color: "#212529",
            background: "linear-gradient(135deg, #4361ee, #7209b7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
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
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.3s"
          }}
          onMouseOver={(e) => {
            e.target.style.background = "#4361ee";
            e.target.style.color = "white";
          }}
          onMouseOut={(e) => {
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
          padding: "16px",
          background: "#f8d7da",
          color: "#721c24",
          borderRadius: "8px",
          marginBottom: "30px",
          border: "1px solid #f5c6cb",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          padding: "16px",
          background: "#d4edda",
          color: "#155724",
          borderRadius: "8px",
          marginBottom: "30px",
          border: "1px solid #c3e6cb",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <span style={{ fontSize: "20px" }}>✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{
        background: "white",
        borderRadius: "16px",
        padding: "40px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)"
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
              color: "#212529",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span style={{ fontSize: "24px" }}>🖼️</span>
              Item Image
            </h3>
            
            <div
              onClick={() => document.getElementById("image-upload").click()}
              style={{
                width: "100%",
                height: "300px",
                border: formData.imagePreview ? "none" : "3px dashed #dee2e6",
                borderRadius: "12px",
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
              onMouseOver={(e) => {
                if (!formData.imagePreview) {
                  e.target.style.borderColor = "#4361ee";
                  e.target.style.background = "#f0f4ff";
                }
              }}
              onMouseOut={(e) => {
                if (!formData.imagePreview) {
                  e.target.style.borderColor = "#dee2e6";
                  e.target.style.background = "#f8f9fa";
                }
              }}
            >
              {!formData.imagePreview ? (
                <>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    background: "#4361ee",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px"
                  }}>
                    <span style={{ fontSize: "24px", color: "white" }}>📤</span>
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
                    JPG, PNG or WEBP (Max 5MB)
                  </p>
                </>
              ) : (
                <div style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  background: "rgba(0,0,0,0.7)",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  Change Image
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
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    image: null,
                    imagePreview: ""
                  }));
                }}
                style={{
                  width: "100%",
                  marginTop: "15px",
                  padding: "12px",
                  background: "#e63946",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.3s"
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "#c1121f";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "#e63946";
                }}
              >
              Remove Image
              </button>
            )}
            
            <p style={{
              marginTop: "15px",
              color: "#6c757d",
              fontSize: "14px",
              lineHeight: 1.6
            }}>
              <strong>Tip:</strong> Clear, well-lit images attract more buyers. Show any wear and tear honestly.
            </p>
          </div>

          {/* Right Column - Form Fields */}
          <div>
            <h3 style={{
              fontSize: "18px",
              marginBottom: "20px",
              color: "#212529",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span style={{ fontSize: "24px" }}>📝</span>
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
                  border: "2px solid #dee2e6",
                  borderRadius: "8px",
                  fontSize: "16px",
                  transition: "all 0.3s"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4361ee";
                  e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#dee2e6";
                  e.target.style.boxShadow = "none";
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
                placeholder="Describe your item in detail. Include brand, model, condition notes, reason for selling, etc."
                rows="5"
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "2px solid #dee2e6",
                  borderRadius: "8px",
                  fontSize: "16px",
                  resize: "vertical",
                  transition: "all 0.3s",
                  minHeight: "120px"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4361ee";
                  e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#dee2e6";
                  e.target.style.boxShadow = "none";
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
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "all 0.3s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4361ee";
                    e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#dee2e6";
                    e.target.style.boxShadow = "none";
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
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    background: "white",
                    cursor: "pointer",
                    transition: "all 0.3s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4361ee";
                    e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#dee2e6";
                    e.target.style.boxShadow = "none";
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {conditions.map(cond => (
                  <label
                    key={cond.value}
                    style={{
                      flex: "1",
                      minWidth: "120px",
                      padding: "16px",
                      border: `2px solid ${
                        formData.condition === cond.value ? "#4361ee" : "#dee2e6"
                      }`,
                      borderRadius: "8px",
                      background: formData.condition === cond.value 
                        ? "#f0f4ff" 
                        : "white",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      textAlign: "center"
                    }}
                    onMouseOver={(e) => {
                      if (formData.condition !== cond.value) {
                        e.target.style.borderColor = "#4361ee";
                        e.target.style.background = "#f8f9fa";
                      }
                    }}
                    onMouseOut={(e) => {
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
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                      {cond.value === "new"}
                      {cond.value === "like_new"}
                      {cond.value === "good"}
                      {cond.value === "fair"}
                      {cond.value === "needs_repair"}
                    </div>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: "600",
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
              padding: "14px 28px",
              background: "transparent",
              border: "2px solid #6c757d",
              color: "#6c757d",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              transition: "all 0.3s"
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#6c757d";
              e.target.style.color = "white";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "transparent";
              e.target.style.color = "#6c757d";
            }}
          >
            ← Cancel
          </button>
          
          <div style={{ display: "flex", gap: "15px" }}>
            <button
              type="button"
              onClick={() => navigate(`/item/${id}`)}
              style={{
                padding: "14px 28px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "all 0.3s"
              }}
              onMouseOver={(e) => {
                e.target.style.background = "#495057";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "#6c757d";
              }}
            >
            Preview
            </button>
            
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "14px 40px",
                background: saving ? "#94d82d" : "#38b000",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "all 0.3s",
                opacity: saving ? 0.8 : 1
              }}
              onMouseOver={(e) => {
                if (!saving) {
                  e.target.style.background = "#2d9100";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(56, 176, 0, 0.3)";
                }
              }}
              onMouseOut={(e) => {
                if (!saving) {
                  e.target.style.background = "#38b000";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid white",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></div>
                  Saving Changes...
                </>
              ) : (
                <>
                Update Item
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Help Section */}
      <div style={{
        marginTop: "40px",
        padding: "25px",
        background: "#f8f9fa",
        borderRadius: "12px",
        borderLeft: "5px solid #4361ee"
      }}>
        <h4 style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "15px",
          color: "#212529"
        }}>
          Tips for Better Listings
        </h4>
        <ul style={{
          margin: 0,
          paddingLeft: "20px",
          color: "#6c757d",
          lineHeight: 1.7
        }}>
          <li>Use clear, well-lit photos from multiple angles</li>
          <li>Be honest about the condition and any defects</li>
          <li>Include brand, model, and other identifying details</li>
          <li>Mention why you're selling and any included accessories</li>
          <li>Price competitively based on condition and market value</li>
        </ul>
      </div>
    </div>
  );
};

export default EditItem;