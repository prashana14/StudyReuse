import { useState, useEffect, useRef } from "react";  
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const AddItem = () => {
  const navigate = useNavigate();
  const formSubmitted = useRef(false);  

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    condition: ""  
  });
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    { value: "", label: "Select item condition" },
    { value: "new", label: "New" },
    { value: "like-new", label: "Like New" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "poor", label: "Poor" }
  ]);

  // 🔥 FIX 1: Clean up localStorage when component mounts
  useEffect(() => {
    // Clear any previous cooldown when user comes to add item page
    localStorage.removeItem('lastItemSubmitTime');
    console.log("🔄 Cleared localStorage cooldown on page load");
    
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      // Also clear on unmount
      localStorage.removeItem('lastItemSubmitTime');
    };
  }, []);

  // 🔥 FIX 2: Reset formSubmitted flag
  useEffect(() => {
    return () => {
      formSubmitted.current = false;
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      e.target.value = '';
      return;
    }
    
    // 🔥 PREVENT SAME FILE UPLOAD
    if (image && 
        image.name === file.name && 
        image.size === file.size &&
        image.lastModified === file.lastModified) {
      console.log("Same file selected again, ignoring...");
      e.target.value = '';
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      e.target.value = '';
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Only JPEG, JPG, PNG, GIF, and WEBP images are allowed");
      e.target.value = '';
      return;
    }
    
    // Clean up previous image preview
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
    
    // Clear the file input to prevent duplicate uploads
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImage(null);
    setImagePreview(null);
    
    // Clear the file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🔥 CRITICAL FIX: Prevent multiple submissions
    if (loading || formSubmitted.current) {
      console.log("Already submitting or submitted, please wait...");
      return;
    }
    
    // 🔥 FIX 3: SMARTER COOLDOWN CHECK
    // Only check cooldown if there was a recent SUCCESSFUL submission
    const now = Date.now();
    const lastSubmitTime = localStorage.getItem('lastItemSubmitTime');
    const timeSinceLastSubmit = lastSubmitTime ? now - parseInt(lastSubmitTime) : 0;
    
    // Check if it's a fresh page load (clear old timestamps)
    const pageLoadTime = localStorage.getItem('pageLoadTime');
    const timeSincePageLoad = pageLoadTime ? now - parseInt(pageLoadTime) : Infinity;
    
    // If page was loaded more than 1 minute ago, ignore old timestamps
    if (timeSincePageLoad > 60000) {
      localStorage.removeItem('lastItemSubmitTime');
      console.log("Cleared old cooldown (page loaded > 1 min ago)");
    }
    
    // Only show cooldown message if it's been less than 5 seconds AND it's not a fresh session
    if (timeSinceLastSubmit < 5000 && timeSincePageLoad <= 60000) {
      const secondsLeft = Math.ceil((5000 - timeSinceLastSubmit) / 1000);
      setError(`Please wait ${secondsLeft} seconds before submitting again`);
      return;
    }
    
    // Mark as submitting
    formSubmitted.current = true;
    setError("");
    setSuccess("");
    setLoading(true);

    console.log("Starting item submission...");

    // Validation
    const validationErrors = [];
    
    if (!formData.title.trim()) {
      validationErrors.push("Please enter a title for the item");
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      validationErrors.push("Please enter a valid price greater than 0");
    }

    if (!formData.category) {
      validationErrors.push("Please select a category");
    }
    
    if (!formData.condition) {
      validationErrors.push("Please select an item condition");
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      validationErrors.push("Please enter a description (minimum 10 characters)");
    }

    if (!image) {
      validationErrors.push("Please upload an image of the item");
    }
    
    if (validationErrors.length > 0) {
      setError(validationErrors[0]); // Show first error
      setLoading(false);
      formSubmitted.current = false;
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("price", formData.price);
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("category", formData.category);
      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("image", image);

      console.log("Sending FormData with fields:");
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value instanceof File ? 
          `${value.name} (${value.type}, ${value.size} bytes)` : value);
      }

      // Get token from localStorage
      const token = localStorage.getItem("token");
      console.log("Token available:", token ? "Yes" : "No");

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await API.post("/items", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log("Response from server:", response.data);

      if (response.data.message || response.data.success) {
        // 🔥 FIX 4: Set cooldown only on success
        localStorage.setItem('lastItemSubmitTime', now.toString());
        setSuccess(response.data.message || "Item added successfully!");
        
        // Reset form after delay
        setTimeout(() => {
          setFormData({
            title: "",
            price: "",
            description: "",
            category: "",
            condition: ""
          });
          
          // Clean up image preview
          if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
          }
          setImage(null);
          setImagePreview(null);
          
          // Clear the file input
          const fileInput = document.getElementById('fileInput');
          if (fileInput) {
            fileInput.value = '';
          }
          
          // Reset submission flag
          formSubmitted.current = false;
          
          // Navigate to dashboard after 2 seconds
          setTimeout(() => navigate("/dashboard"), 2000);
        }, 1500);
      } else {
        setError(response.data.message || "Failed to add item");
        formSubmitted.current = false;
      }
      
    } catch (err) {
      console.error("Error adding item:", err);
      
      // 🔥 FIX 5: Clear cooldown on error
      localStorage.removeItem('lastItemSubmitTime');
      formSubmitted.current = false;
      
      if (err.name === 'AbortError') {
        setError("Request timed out. Please try again.");
      } else if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 400) {
        const errorData = err.response?.data;
        
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map(err => 
            typeof err === 'object' ? JSON.stringify(err) : err
          ).join(", ");
          setError(`Validation Error: ${errorMessages}`);
        } else if (errorData?.message) {
          setError(`Error: ${errorData.message}`);
        } else {
          setError("Bad Request. Please check all fields.");
        }
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(", "));
      } else if (err.message === "Network Error") {
        setError("Cannot connect to server. Please check if backend is running.");
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
          background: error.includes("wait") 
            ? "linear-gradient(135deg, #f39c12, #e67e22)" // Orange for cooldown
            : "linear-gradient(135deg, #ff6b6b, #e63946)", // Red for errors
          color: "white",
          padding: "16px 20px",
          borderRadius: "10px",
          marginBottom: "30px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          animation: "fadeIn 0.3s ease"
        }}>
          <span style={{ fontSize: "20px" }}>
            {error.includes("wait") ? "⏳" : "⚠️"}
          </span>
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
          <span style={{ fontSize: "20px" }}></span>
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
        <form onSubmit={handleSubmit} noValidate>
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
                  disabled={loading}
                  style={{ 
                    width: "100%",
                    padding: "14px 16px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "all 0.3s",
                    background: loading ? "#f8f9fa" : "white"
                  }}
                  onFocus={(e) => !loading && (e.target.style.borderColor = "#4361ee")}
                  onBlur={(e) => !loading && (e.target.style.borderColor = "#e0e0e0")}
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
                    min="0"
                    step="0.01"
                    disabled={loading}
                    style={{ 
                      width: "100%",
                      padding: "14px 14px 14px 50px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "16px",
                      transition: "all 0.3s",
                      background: loading ? "#f8f9fa" : "white"
                    }}
                    onFocus={(e) => !loading && (e.target.style.borderColor = "#4361ee")}
                    onBlur={(e) => !loading && (e.target.style.borderColor = "#e0e0e0")}
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
                  disabled={loading}
                  style={{ 
                    width: "100%",
                    padding: "14px 40px 14px 16px",
                    border: formData.category ? "1px solid #e0e0e0" : "1px solid #ff6b6b",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: loading ? "#f8f9fa" : "white",
                    appearance: "none",
                    backgroundImage: "url('data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%234361ee\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 16px center",
                    backgroundSize: "16px",
                    transition: "all 0.3s",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                  onFocus={(e) => !loading && (e.target.style.borderColor = "#4361ee")}
                  onBlur={(e) => !loading && (e.target.style.borderColor = formData.category ? "#e0e0e0" : "#ff6b6b")}
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
                  disabled={loading}
                  style={{ 
                    width: "100%",
                    padding: "14px 40px 14px 16px",
                    border: formData.condition ? "1px solid #e0e0e0" : "1px solid #ff6b6b",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: loading ? "#f8f9fa" : "white",
                    appearance: "none",
                    backgroundImage: "url('data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%234361ee\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 16px center",
                    backgroundSize: "16px",
                    transition: "all 0.3s",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                  onFocus={(e) => !loading && (e.target.style.borderColor = "#4361ee")}
                  onBlur={(e) => !loading && (e.target.style.borderColor = formData.condition ? "#e0e0e0" : "#ff6b6b")}
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
                    border: !image ? "2px dashed #ff6b6b" : "2px dashed #e0e0e0",
                    borderRadius: "12px",
                    padding: "30px",
                    textAlign: "center",
                    transition: "all 0.3s",
                    cursor: loading ? "not-allowed" : "pointer",
                    background: imagePreview ? `url(${imagePreview}) center/cover no-repeat, #f8f9fa` : "#f8f9fa",
                    height: "250px",
                    position: "relative",
                    overflow: "hidden",
                    opacity: loading ? 0.7 : 1
                  }}
                  onClick={() => !loading && document.getElementById('fileInput').click()}
                  onDragOver={(e) => {
                    if (!loading) {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "#4361ee";
                      e.currentTarget.style.background = "#eef2ff";
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.borderColor = !image ? "#ff6b6b" : "#e0e0e0";
                      e.currentTarget.style.background = imagePreview ? 
                        `url(${imagePreview}) center/cover no-repeat, #f8f9fa` : "#f8f9fa";
                    }
                  }}
                  onDrop={(e) => {
                    if (!loading) {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        const input = document.getElementById('fileInput');
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        input.files = dataTransfer.files;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                      }
                    }
                  }}
                >
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                    disabled={loading}
                  />
                  
                  {!imagePreview ? (
                    <>
                      <div style={{ fontSize: "48px", marginBottom: "16px", color: loading ? "#ccc" : "#4361ee" }}>
                      </div>
                      <p style={{ color: loading ? "#ccc" : "#4361ee", fontWeight: "600", marginBottom: "8px" }}>
                        {loading ? "Upload in progress..." : "Click to upload or drag & drop"}
                      </p>
                      <p style={{ color: loading ? "#ccc" : "#6c757d", fontSize: "14px" }}>
                        PNG, JPG, JPEG, GIF, WEBP up to 5MB
                      </p>
                    </>
                  ) : (
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(0, 0, 0, 0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: loading ? 0.7 : 1
                    }}>
                      <div style={{
                        background: "rgba(0, 0, 0, 0.8)",
                        color: "white",
                        padding: "12px 24px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        {loading ? "Uploading..." : "Click to change image"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {imagePreview && (
                <div style={{ 
                  textAlign: "center", 
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px"
                }}>
                  <span style={{ 
                    color: "#38b000", 
                    fontSize: "14px", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px" 
                  }}>
                    <span>✅</span> Image selected: {image.name}
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{
                        background: "#ff6b6b",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 12px",
                        fontSize: "12px",
                        cursor: "pointer",
                        transition: "all 0.3s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
              
              {imagePreview && (
                <p style={{ 
                  fontSize: "12px", 
                  color: "#6c757d", 
                  textAlign: "center",
                  marginTop: "4px" 
                }}>
                  Size: {(image.size / 1024 / 1024).toFixed(2)} MB • 
                  Type: {image.type.split('/')[1].toUpperCase()}
                </p>
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
              disabled={loading}
              rows="5"
              style={{ 
                width: "100%",
                padding: "14px",
                border: formData.description.length >= 10 ? "1px solid #e0e0e0" : "1px solid #ff6b6b",
                borderRadius: "8px",
                fontSize: "16px",
                resize: "vertical",
                minHeight: "120px",
                transition: "all 0.3s",
                background: loading ? "#f8f9fa" : "white"
              }}
              onFocus={(e) => !loading && (e.target.style.borderColor = "#4361ee")}
              onBlur={(e) => !loading && (e.target.style.borderColor = formData.description.length >= 10 ? "#e0e0e0" : "#ff6b6b")}
            />
            <p style={{ 
              fontSize: "12px", 
              color: formData.description.length >= 10 ? "#38b000" : "#ff6b6b", 
              marginTop: "8px",
              fontWeight: formData.description.length < 10 ? "600" : "normal"
            }}>
              {formData.description.length} characters • Minimum 10 characters required
              {formData.description.length < 10 }
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
              onClick={() => {
                // Clear localStorage before navigating away
                localStorage.removeItem('lastItemSubmitTime');
                navigate(-1);
              }}
              disabled={loading}
              style={{ 
                flex: 1, 
                padding: "16px",
                background: "transparent",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                color: "#495057",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                fontSize: "16px",
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.borderColor = "#4361ee";
                  e.target.style.color = "#4361ee";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.color = "#495057";
                }
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
                opacity: loading ? 0.7 : 1,
                position: "relative",
                zIndex: 10
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
          <span style={{ fontSize: "24px" }}></span> Tips for a Successful Listing
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