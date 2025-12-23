import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const AddItem = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category: ""
  });
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
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
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!image) {
      setError("Please upload an image of the item");
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("image", image);

    try {
      await API.post("/items", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Show success message
      setError("");
      alert("✅ Item added successfully!");
      navigate("/dashboard");
      
    } catch (err) {
      console.error("Error adding item:", err);
      setError(err.response?.data?.message || "Failed to add item. Please try again.");
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

      {/* Main Form Card */}
      <div className="card" style={{ 
        padding: "40px", 
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
        border: "none"
      }}>
        {error && (
          <div style={{
            background: "linear-gradient(135deg, #ff6b6b, #e63946)",
            color: "white",
            padding: "16px 20px",
            borderRadius: "10px",
            marginBottom: "30px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
            {/* Left Column */}
            <div>
              <div className="form-group">
                <label className="form-label">Item Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Calculus Textbook 2023 Edition"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                  style={{ padding: "14px" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (Rs.) *</label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#4361ee",
                    fontWeight: "600"
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
                    className="form-control"
                    style={{ padding: "14px 14px 14px 50px" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                  style={{ padding: "14px", appearance: "none", backgroundImage: "url('data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%234361ee\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')", backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center", backgroundSize: "16px" }}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div>
              <div className="form-group">
                <label className="form-label">Item Image *</label>
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
                    position: "relative"
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
                    <span>✅</span> Image selected
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description Field */}
          <div className="form-group" style={{ marginBottom: "30px" }}>
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              placeholder="Describe your item in detail. Include condition, edition, author, and any other relevant information..."
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="5"
              className="form-control"
              style={{ padding: "14px", resize: "vertical" }}
            />
            <p style={{ fontSize: "12px", color: "#6c757d", marginTop: "8px" }}>
              Minimum 50 characters recommended
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
              className="btn btn-outline"
              style={{ flex: 1, padding: "16px" }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ 
                flex: 2, 
                padding: "16px",
                background: loading 
                  ? "#ccc" 
                  : "linear-gradient(135deg, #4361ee, #7209b7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px"
              }}
            >
              {loading ? (
                <>
                  <div className="loading" style={{ width: "20px", height: "20px", borderWidth: "2px" }}></div>
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
      <div className="card" style={{ marginTop: "30px", padding: "30px" }}>
        <h3 style={{ marginBottom: "20px", color: "#212529", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>💡</span> Tips for a Successful Listing
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
          <div>
            <h4 style={{ fontSize: "16px", marginBottom: "8px", color: "#4361ee" }}>Clear Photos</h4>
            <p style={{ fontSize: "14px", color: "#6c757d" }}>
              Take well-lit photos from multiple angles to show the item's condition.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: "16px", marginBottom: "8px", color: "#4361ee" }}>Detailed Description</h4>
            <p style={{ fontSize: "14px", color: "#6c757d" }}>
              Include edition, author, publication year, and any markings or highlights.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: "16px", marginBottom: "8px", color: "#4361ee" }}>Fair Pricing</h4>
            <p style={{ fontSize: "14px", color: "#6c757d" }}>
              Research similar items to set a competitive price. Consider item condition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItem;