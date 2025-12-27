import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const AddItem = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    condition: "good" // Add condition field
  });
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // Add success state
  const [loading, setLoading] = useState(false);
  
  const [categories] = useState([
    "Textbooks",
    "Notes",
    "Lab Equipment",
    "Stationery",
    "Electronics",
    "Study Guides",
    "Reference Books",
    "Other"
  ]);

  const [conditions] = useState([
    { value: "new", label: "New - Never used" },
    { value: "like-new", label: "Like New - Minimal signs of use" },
    { value: "good", label: "Good - Some wear but fully functional" },
    { value: "fair", label: "Fair - Visible wear, still usable" },
    { value: "poor", label: "Poor - Significant wear, may need repair" }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError("Only JPEG, JPG, PNG, and GIF images are allowed");
        return;
      }
      
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(""); // Clear any previous errors
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    console.log("📝 Starting item submission...");

    // Validation
    if (!formData.title.trim()) {
      setError("Please enter a title for the item");
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Please enter a valid price greater than 0");
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError("Please select a category");
      setLoading(false);
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setError("Please enter a description (minimum 10 characters)");
      setLoading(false);
      return;
    }

    if (!image) {
      setError("Please upload an image of the item");
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("price", parseFloat(formData.price));
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("category", formData.category);
      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("image", image);

      console.log("📤 Sending FormData with fields:");
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value instanceof File ? 
          `${value.name} (${value.type}, ${value.size} bytes)` : value);
      }

      // Get token from localStorage
      const token = localStorage.getItem("token");
      console.log("🔑 Token available:", token ? "Yes" : "No");

      const response = await API.post("/items", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}` // Explicitly add token
        }
      });

      console.log("✅ Response from server:", response.data);

    // pages/AddItem.jsx - Line 86
      if (response.data.message) {  // ✅ CHANGE FROM response.data.success
          setSuccess(response.data.message || "✅ Item added successfully!");
        
        // Reset form after delay
        setTimeout(() => {
          setFormData({
            title: "",
            price: "",
            description: "",
            category: "",
            condition: "good"
          });
          setImage(null);
          setImagePreview(null);
          
          // Navigate to dashboard after 2 seconds
          setTimeout(() => navigate("/dashboard"), 2000);
        }, 1500);
      } else {
        setError(response.data.message || "Failed to add item");
      }
      
    } catch (err) {
      console.error("❌ Error adding item:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(", "));
      } else if (err.message === "Network Error") {
        setError("Cannot connect to server. Please check if backend is running on port 4000.");
      } else {
        setError("Failed to add item. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "900px", margin: "40px auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ 
          fontSize: "2.5rem", 
          marginBottom: "16px",
          background: "linear-gradient(135deg, #4361ee, #7209b7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          Add Study Item
        </h1>
        <p style={{ color: "#6c757d", fontSize: "1.125rem", maxWidth: "600px", margin: "0 auto" }}>
          Share your study materials with fellow students. Fill in the details below to list your item.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: "linear-gradient(135deg, #ff6b6b, #e63946)",
          color: "white",
          padding: "16px 20px",
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
            style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div style={{
          background: "linear-gradient(135deg, #38b000, #2d9100)",
          color: "white",
          padding: "16px 20px",
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

      {/* Main Form Card */}
      <div className="card" style={{ 
        padding: "40px", 
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
        border: "none",
        borderRadius: "12px"
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
            {/* Left Column */}
            <div>
              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label" style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#212529" }}>
                  Item Title *
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Calculus Textbook 2023 Edition"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  style={{ 
                    width: "100%",
                    padding: "14px 16px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "all 0.3s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4361ee"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label" style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#212529" }}>
                  Price (Rs.) *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#4361ee",
                    fontWeight: "600",
                    zIndex: 1
                  }}>Rs.</span>
                  <input
                    type="number"
                    name="price"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    style={{ 
                      width: "100%",
                      padding: "14px 14px 14px 50px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "16px",
                      transition: "all 0.3s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#4361ee"}
                    onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label" style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#212529" }}>
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  style={{ 
                    width: "100%",
                    padding: "14px 40px 14px 16px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "white",
                    appearance: "none",
                    backgroundImage: "url('data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%234361ee\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 16px center",
                    backgroundSize: "16px",
                    transition: "all 0.3s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4361ee"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label" style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#212529" }}>
                  Condition *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
                  style={{ 
                    width: "100%",
                    padding: "14px 40px 14px 16px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "white",
                    appearance: "none",
                    backgroundImage: "url('data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%234361ee\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 16px center",
                    backgroundSize: "16px",
                    transition: "all 0.3s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4361ee"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                >
                  {conditions.map(cond => (
                    <option key={cond.value} value={cond.value}>
                      {cond.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div>
              <div className="form-group">
                <label className="form-label" style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#212529" }}>
                  Item Image *
                </label>
                <div
                  style={{
                    border: "2px dashed #e0e0e0",
                    borderRadius: "12px",
                    padding: "30px",
                    textAlign: "center",
                    transition: "all 0.3s",
                    cursor: "pointer",
                    background: imagePreview ? `url(${imagePreview}) center/cover no-repeat` : "#f8f9fa",
                    height: "250px",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  onClick={() => document.getElementById('fileInput').click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "#4361ee";
                    e.currentTarget.style.background = "#eef2ff";
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.background = imagePreview ? `url(${imagePreview}) center/cover no-repeat` : "#f8f9fa";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      setImage(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                >
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                    required
                  />
                  
                  {!imagePreview ? (
                    <>
                      <div style={{ fontSize: "48px", marginBottom: "16px", color: "#4361ee" }}>
                        📁
                      </div>
                      <p style={{ color: "#4361ee", fontWeight: "600", marginBottom: "8px" }}>
                        Click to upload or drag & drop
                      </p>
                      <p style={{ color: "#6c757d", fontSize: "14px" }}>
                        PNG, JPG, JPEG up to 5MB
                      </p>
                    </>
                  ) : (
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      background: "rgba(0, 0, 0, 0.7)",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "14px"
                    }}>
                      Click to change image
                    </div>
                  )}
                </div>
              </div>
              
              {imagePreview && (
                <div style={{ textAlign: "center", marginTop: "10px" }}>
                  <span style={{ color: "#38b000", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <span>✅</span> Image selected: {image.name}
                  </span>
                  <p style={{ fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
                    Size: {(image.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description Field */}
          <div className="form-group" style={{ marginBottom: "30px" }}>
            <label className="form-label" style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#212529" }}>
              Description *
            </label>
            <textarea
              name="description"
              placeholder="Describe your item in detail. Include condition, edition, author, and any other relevant information..."
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="5"
              style={{ 
                width: "100%",
                padding: "14px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "16px",
                resize: "vertical",
                minHeight: "120px",
                transition: "all 0.3s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#4361ee"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
            <p style={{ fontSize: "12px", color: "#6c757d", marginTop: "8px" }}>
              {formData.description.length} characters • Minimum 50 characters recommended
            </p>
          </div>

          {/* Form Actions */}
          <div style={{ 
            display: "flex", 
            gap: "20px", 
            paddingTop: "20px", 
            borderTop: "1px solid #e0e0e0" 
          }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ 
                flex: 1, 
                padding: "16px",
                background: "transparent",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                color: "#495057",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s",
                fontSize: "16px"
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "#4361ee";
                e.target.style.color = "#4361ee";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "#e0e0e0";
                e.target.style.color = "#495057";
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={{ 
                flex: 2, 
                padding: "16px",
                background: loading 
                  ? "#ccc" 
                  : "linear-gradient(135deg, #4361ee, #7209b7)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                fontSize: "16px",
                transition: "all 0.3s",
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 8px 25px rgba(67, 97, 238, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{ 
                    width: "20px", 
                    height: "20px", 
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></div>
                  Adding Item...
                </>
              ) : (
                <>
                  <span>📦</span> 
                  Add Item to Marketplace
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tips Section */}
      <div className="card" style={{ 
        marginTop: "30px", 
        padding: "30px",
        borderRadius: "12px",
        background: "#f8f9fa",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ 
          marginBottom: "20px", 
          color: "#212529", 
          display: "flex", 
          alignItems: "center", 
          gap: "10px",
          fontSize: "20px"
        }}>
          <span style={{ fontSize: "24px" }}>💡</span> Tips for a Successful Listing
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "8px" }}>
            <h4 style={{ fontSize: "16px", marginBottom: "8px", color: "#4361ee" }}>Clear Photos</h4>
            <p style={{ fontSize: "14px", color: "#6c757d" }}>
              Take well-lit photos from multiple angles to show the item's condition.
            </p>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "8px" }}>
            <h4 style={{ fontSize: "16px", marginBottom: "8px", color: "#4361ee" }}>Detailed Description</h4>
            <p style={{ fontSize: "14px", color: "#6c757d" }}>
              Include edition, author, publication year, and any markings or highlights.
            </p>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "8px" }}>
            <h4 style={{ fontSize: "16px", marginBottom: "8px", color: "#4361ee" }}>Fair Pricing</h4>
            <p style={{ fontSize: "14px", color: "#6c757d" }}>
              Research similar items to set a competitive price. Consider item condition.
            </p>
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
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

export default AddItem;