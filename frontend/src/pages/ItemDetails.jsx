
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext"; // ✅ Now this will work

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth(); // ✅ Use the hook
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await API.get(`/items/${id}`);
        setItem(res.data);
        
        // ✅ Check if current user is the owner
        if (user && res.data.owner && res.data.owner._id === user.id) {
          setIsOwner(true);
        }
        
        // ✅ Check if current user is admin
        if (user && user.role === 'admin') {
          setIsAdmin(true);
        }
        
        console.log("Item fetched:", res.data);
        console.log("Current user:", user);
        console.log("Is owner:", isOwner);
        console.log("Is admin:", isAdmin);
      } catch (err) {
        console.error("Error fetching item:", err);
        setError("Failed to load item details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, user]); // ✅ Add user to dependencies

  const handleDelete = async () => {
    // ✅ Check if user is authenticated
    if (!isAuthenticated) {
      alert("Please login to delete items");
      navigate('/login');
      return;
    }

    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      await API.delete(`/items/${id}`, {
        headers: {
          Authorization: `Bearer ${token}` // ✅ Use token from auth context
        }
      });
      
      alert("Item deleted successfully!");
      navigate("/dashboard"); // Or navigate to user's items page
    } catch (err) {
      console.error("Error deleting item:", err);
      alert(err.response?.data?.message || "Failed to delete item. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/edit-item/${id}`);
  };

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
      {/* ✅ Owner/Admin Actions Section - Add this */}
      {(isOwner || isAdmin) && (
        <div style={{
          background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "30px",
          borderLeft: "5px solid #4361ee"
        }}>
          <h3 style={{ marginBottom: "15px", color: "#212529" }}>
            {isAdmin && !isOwner ? "Admin Controls" : "Manage Your Item"}
          </h3>
          <div style={{ display: "flex", gap: "15px" }}>
            {isOwner && (
              <button
                onClick={handleEdit}
                className="btn btn-outline"
                style={{
                  padding: "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                ✏️ Edit Item
              </button>
            )}
            
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn"
              style={{
                padding: "12px 24px",
                background: "#e63946",
                color: "white",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: deleting ? 0.7 : 1
              }}
            >
              {deleting ? (
                <>
                  <div className="loading" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "white" }}></div>
                  Deleting...
                </>
              ) : (
                <>
                  🗑️ Delete Item
                </>
              )}
            </button>
          </div>
          <p style={{ marginTop: "10px", fontSize: "13px", color: "#6c757d" }}>
            {isAdmin && !isOwner 
              ? "As an admin, you can delete any item from the system."
              : "Only you can edit or delete this item."
            }
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "50px" }}>
        {/* Left Column - Image */}
        <div>
          {item.imageURL || item.image ? (
            <img
              src={item.imageURL || item.image}
              alt={item.title}
              style={{
                width: "100%",
                borderRadius: "16px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                maxHeight: "500px",
                objectFit: "cover"
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
            {/* Item Status Badge */}
            <div style={{ marginBottom: "15px" }}>
              {!item.isApproved && (
                <span style={{
                  display: "inline-block",
                  background: "#fff3cd",
                  color: "#856404",
                  padding: "8px 20px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "1px solid #ffeaa7"
                }}>
                  ⏳ Pending Approval
                </span>
              )}
              {item.isFlagged && (
                <span style={{
                  display: "inline-block",
                  background: "#f8d7da",
                  color: "#721c24",
                  padding: "8px 20px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "1px solid #f5c6cb",
                  marginLeft: "10px"
                }}>
                  ⚠️ Flagged
                </span>
              )}
            </div>
            
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
              
              {item.condition && (
                <span style={{
                  display: "inline-block",
                  background: "#f0f9ff",
                  color: "#0369a1",
                  padding: "8px 20px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>
                  Condition: {item.condition}
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
                    {item.owner?.email || "Contact via chat"}
                  </p>
                  <p style={{ margin: "4px 0 0 0", opacity: 0.8, fontSize: "13px" }}>
                    Member since {new Date(item.createdAt).getFullYear() || "2024"}
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
                navigate(`/barter/request/${item._id}`);
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
            
            <button 
              onClick={() => {
                // Share item
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
              }}
              className="btn btn-outline"
              style={{ 
                padding: "16px 24px",
                fontSize: "20px"
              }}
            >
              📤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;