import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await API.get(`/items/${id}`);
        setItem(res.data);
      } catch (err) {
        console.error("Error fetching item:", err);
        setError("Failed to load item details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: "1200px", margin: "40px auto", textAlign: "center", padding: "60px" }}>
        <div className="loading" style={{ margin: "0 auto", width: "50px", height: "50px", borderWidth: "4px", borderTopColor: "#4361ee" }}></div>
        <p style={{ marginTop: "20px", color: "#6c757d", fontSize: "16px" }}>Loading item details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ maxWidth: "1200px", margin: "40px auto", textAlign: "center", padding: "60px" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px", color: "#e63946" }}>❌</div>
        <h2 style={{ color: "#e63946", marginBottom: "16px" }}>Error Loading Item</h2>
        <p style={{ color: "#6c757d", marginBottom: "30px" }}>{error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="btn btn-outline"
          style={{ padding: "12px 24px" }}
        >
          ← Go Back
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container" style={{ maxWidth: "1200px", margin: "40px auto", textAlign: "center", padding: "60px" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px", opacity: 0.3 }}>🔍</div>
        <h2 style={{ marginBottom: "16px" }}>Item Not Found</h2>
        <p style={{ color: "#6c757d", marginBottom: "30px" }}>The item you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate("/")}
          className="btn btn-primary"
          style={{ padding: "12px 24px" }}
        >
          Browse Items
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "40px auto" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "30px", fontSize: "14px", color: "#6c757d" }}>
        <Link to="/" style={{ color: "#4361ee", textDecoration: "none" }}>Home</Link>
        <span style={{ margin: "0 10px" }}>›</span>
        <Link to="/dashboard" style={{ color: "#4361ee", textDecoration: "none" }}>Browse</Link>
        <span style={{ margin: "0 10px" }}>›</span>
        <span>{item.title}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "50px" }}>
        {/* Left Column - Image */}
        <div>
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              style={{
                width: "100%",
                borderRadius: "16px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
              }}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "400px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "64px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
            }}>
              📚
            </div>
          )}
          
          <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
            <Link 
              to={`/chat/${item._id}`}
              className="btn btn-primary"
              style={{ 
                flex: 1, 
                padding: "16px 24px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                gap: "10px",
                fontSize: "16px",
                fontWeight: "600"
              }}
            >
              💬 Chat About Item
            </Link>
            
            <Link 
              to={`/reviews/${item._id}`}
              className="btn btn-outline"
              style={{ 
                flex: 1, 
                padding: "16px 24px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                gap: "10px",
                fontSize: "16px",
                fontWeight: "600"
              }}
            >
              ⭐ View Reviews
            </Link>
          </div>
        </div>

        {/* Right Column - Details */}
        <div>
          <div style={{ marginBottom: "30px" }}>
            <h1 style={{ 
              fontSize: "2.5rem", 
              marginBottom: "16px",
              color: "#212529",
              lineHeight: 1.2
            }}>
              {item.title}
            </h1>
            
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
              <span style={{ 
                fontSize: "32px", 
                fontWeight: "700", 
                color: "#4361ee",
                background: "linear-gradient(135deg, #4361ee, #7209b7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                Rs. {item.price}
              </span>
              
              {item.category && (
                <span style={{
                  display: "inline-block",
                  background: "#eef2ff",
                  color: "#4361ee",
                  padding: "8px 20px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>
                  {item.category}
                </span>
              )}
            </div>
            
            <div style={{ 
              padding: "25px", 
              background: "#f8f9fa", 
              borderRadius: "12px",
              marginBottom: "30px"
            }}>
              <h3 style={{ marginBottom: "15px", fontSize: "18px", color: "#212529" }}>Description</h3>
              <p style={{ 
                fontSize: "16px", 
                lineHeight: 1.7, 
                color: "#495057",
                margin: 0,
                whiteSpace: "pre-wrap"
              }}>
                {item.description || "No description available for this item."}
              </p>
            </div>
            
            <div style={{ 
              padding: "25px", 
              background: "linear-gradient(135deg, #4361ee, #7209b7)",
              color: "white",
              borderRadius: "12px",
              marginBottom: "30px"
            }}>
              <h3 style={{ marginBottom: "15px", fontSize: "18px" }}>Seller Information</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "bold"
                }}>
                  {item.owner?.name?.charAt(0) || "S"}
                </div>
                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "600" }}>
                    {item.owner?.name || "Seller"}
                  </p>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: "14px" }}>
                    Member since 2024
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Actions */}
          <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
            <button 
              onClick={() => {
                // Handle barter request
                alert("Barter request sent!");
              }}
              className="btn"
              style={{ 
                flex: 1, 
                padding: "16px 24px",
                background: "linear-gradient(135deg, #38b000, #2d9100)",
                color: "white",
                border: "none",
                fontSize: "16px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px"
              }}
            >
              🔄 Request Barter
            </button>
            
            <button 
              onClick={() => {
                // Handle favorite
                alert("Added to favorites!");
              }}
              className="btn btn-outline"
              style={{ 
                padding: "16px 24px",
                fontSize: "20px"
              }}
            >
              ♡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;