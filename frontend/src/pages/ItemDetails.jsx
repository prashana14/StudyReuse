import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  
  // State variables
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Barter-specific states
  const [barterLoading, setBarterLoading] = useState(false);
  const [barterSuccess, setBarterSuccess] = useState("");
  const [barterError, setBarterError] = useState("");
  const [isOwnItem, setIsOwnItem] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        console.log(`📡 Fetching item ${id}`);
        
        const config = {};
        if (token) {
          config.headers = { Authorization: `Bearer ${token}` };
        }
        
        const response = await API.get(`/items/${id}`, config);
        
        // Get the item data - handle both response formats
        const responseData = response?.data;
        let itemData = null;
        
        if (responseData?.data) {
          // Case 1: response.data.data exists
          itemData = responseData.data;
        } else if (responseData && typeof responseData === 'object' && responseData._id) {
          // Case 2: response.data is the item itself
          itemData = responseData;
        } else {
          // Case 3: response is the item
          itemData = response;
        }
        
        console.log(' Item data received:', {
          title: itemData?.title,
          isApproved: itemData?.isApproved,
          hasImage: !!(itemData?.imageURL || itemData?.image)
        });
        
        if (!itemData) {
          throw new Error('No item data received');
        }
        
        // Set item state
        setItem(itemData);
        
        // Check ownership
        if (user && itemData.owner) {
          const ownerId = itemData.owner._id || itemData.owner;
          const userId = user._id || user.id;
          const isOwnerCheck = ownerId === userId;
          setIsOwner(isOwnerCheck);
          setIsOwnItem(isOwnerCheck);
        }
        
        // Check admin status
        if (user?.role === 'admin') {
          setIsAdmin(true);
        }
        
      } catch (err) {
        console.error(" Error fetching item:", err);
        
        const errorMessage = err.response?.data?.message || err.message || "Failed to load item";
        
        if (err.response?.status === 403) {
          setError("Access denied. This item may be private or pending approval.");
        } else if (err.response?.status === 404) {
          setError("Item not found. It may have been deleted.");
        } else if (err.response?.status === 401) {
          setError("Please log in to view this item.");
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchItem();
  }, [id, user, token]);

  // Barter Request Function
  const handleBarterRequest = async () => {
    if (!isAuthenticated) {
      alert("Please login to request barter");
      navigate('/login');
      return;
    }

    if (isOwnItem) {
      setBarterError(" You cannot barter with your own item");
      setTimeout(() => setBarterError(""), 3000);
      return;
    }

    setBarterLoading(true);
    setBarterError("");
    setBarterSuccess("");

    try {
      await API.post("/barter", {
        itemId: item._id,
        message: `I'm interested in bartering for your ${item.title}`
      });

      setBarterSuccess(" Barter request sent!");
      
      setTimeout(() => {
        setBarterSuccess("");
      }, 5000);

    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to send barter request";
      setBarterError(`❌ ${errorMsg}`);
      
      setTimeout(() => {
        setBarterError("");
      }, 5000);
    } finally {
      setBarterLoading(false);
    }
  };

  const handleDelete = async () => {
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
      await API.delete(`/items/${id}`);
      alert("Item deleted successfully!");
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete item.");
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
        <div style={{ 
          width: "50px", 
          height: "50px", 
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #4361ee",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto"
        }}></div>
        <p style={{ marginTop: "20px", color: "#6c757d", fontSize: "16px" }}>Loading item details...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ maxWidth: "1200px", margin: "40px auto", textAlign: "center", padding: "60px" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px", color: "#e63946" }}>❌</div>
        <h2 style={{ color: "#e63946", marginBottom: "16px" }}>Error Loading Item</h2>
        <p style={{ color: "#6c757d", marginBottom: "30px", fontSize: "16px", lineHeight: "1.6" }}>{error}</p>
        
        <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
          <button 
            onClick={() => navigate(-1)}
            className="btn btn-outline"
            style={{ padding: "12px 24px" }}
          >
            ← Go Back
          </button>
          
          <button 
            onClick={() => navigate("/")}
            className="btn btn-primary"
            style={{ padding: "12px 24px" }}
          >
            Browse Items
          </button>
        </div>
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

  // Helper function to check if item is approved (handles both boolean and string)
  const isItemApproved = () => {
    if (item.isApproved === true || item.isApproved === 'true') return true;
    if (item.isApproved === false || item.isApproved === 'false') return false;
    return Boolean(item.isApproved); // fallback
  };

  // Helper function to check if item is flagged
  const isItemFlagged = () => {
    if (item.isFlagged === true || item.isFlagged === 'true') return true;
    if (item.isFlagged === false || item.isFlagged === 'false') return false;
    return Boolean(item.isFlagged); // fallback
  };

  // Build image URL
  const getImageUrl = () => {
    const imageUrl = item.imageURL || item.image;
    if (!imageUrl) return null;
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else if (imageUrl.startsWith('/')) {
      return `http://localhost:4000${imageUrl}`;
    } else {
      return `http://localhost:4000/uploads/${imageUrl}`;
    }
  };

  const imageUrl = getImageUrl();
  const approved = isItemApproved();
  const flagged = isItemFlagged();

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "40px auto" }}>
      {/* Success/Error Messages */}
      {(barterSuccess || barterError) && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          padding: "16px 20px",
          borderRadius: "8px",
          color: "white",
          fontWeight: "600",
          zIndex: 1000,
          animation: "slideIn 0.3s ease",
          background: barterSuccess 
            ? "linear-gradient(135deg, #38b000, #2d9100)"
            : "linear-gradient(135deg, #e63946, #d00000)",
          boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center"
        }}>
          {barterSuccess || barterError}
          <button 
            onClick={() => {
              setBarterSuccess("");
              setBarterError("");
            }}
            style={{
              marginLeft: "15px",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "18px"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Owner/Admin Actions Section */}
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
              Edit Item
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
                  <div style={{ 
                    width: "16px", 
                    height: "16px", 
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></div>
                  Deleting...
                </>
              ) : (
                <>
                Delete Item
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
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title || 'Item'}
              style={{
                width: "100%",
                borderRadius: "16px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                maxHeight: "500px",
                objectFit: "cover"
              }}
              onError={(e) => {
                console.log('Image failed to load, using placeholder');
                e.target.src = 'https://via.placeholder.com/500x400?text=Image+Not+Available';
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
            Chat About Item
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
              }}>
            View Reviews
            </Link>
          </div>
        </div>

        {/* Right Column - Details */}
        <div>
          <div style={{ marginBottom: "30px" }}>
            {/* Item Status Badge - FIXED LOGIC */}
            <div style={{ marginBottom: "15px" }}>
              {!approved ? (
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
                Pending Approval
                </span>
              ) : flagged ? (
                <span style={{
                  display: "inline-block",
                  background: "#f8d7da",
                  color: "#721c24",
                  padding: "8px 20px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "1px solid #f5c6cb"
                }}>
                Flagged
                </span>
              ) : (
                <span style={{
                  display: "inline-block",
                  background: "#d1e7dd",
                  color: "#0f5132",
                  padding: "8px 20px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "1px solid #badbcc"
                }}>
                 Approved
                </span>
              )}
            </div>
            
            <h1 style={{ 
              fontSize: "2.5rem", 
              marginBottom: "16px",
              color: "#212529",
              lineHeight: 1.2
            }}>
              {item.title || "Untitled Item"}
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
                Rs. {item.price || "0"}
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
                    Member since {item.createdAt ? new Date(item.createdAt).getFullYear() : "2024"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Actions */}
          <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
            {/* Request Barter Button - Only show if NOT owner's item */}
            {!isOwnItem && (
              <button 
                onClick={handleBarterRequest}
                disabled={barterLoading}
                className="btn"
                style={{ 
                  flex: 1, 
                  padding: "16px 24px",
                  background: barterLoading 
                    ? "#6c757d" 
                    : "linear-gradient(135deg, #38b000, #2d9100)",
                  color: "white",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  cursor: barterLoading ? "not-allowed" : "pointer",
                  opacity: barterLoading ? 0.7 : 1
                }}
              >
                {barterLoading ? (
                  <>
                    <div style={{ 
                      width: "20px", 
                      height: "20px", 
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }}></div>
                    Sending...
                  </>
                ) : (
                  <>
                  Request Barter
                  </>
                )}
              </button>
            )}
            
            <button 
              onClick={() => alert("Added to favorites!")}
              className="btn btn-outline"
              style={{ padding: "16px 24px", fontSize: "20px" }}
            >
              ♡
            </button>
            
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
              }}
              className="btn btn-outline"
              style={{ padding: "16px 24px", fontSize: "20px" }}
            >
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { 
            transform: translateX(100px); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0); 
            opacity: 1; 
          }
        }
      `}</style>
    </div>
  );
};

export default ItemDetails;