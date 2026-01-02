import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiService from "../services/api"; // CHANGED: Import apiService
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

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

  const { addToCart, getItemQuantity } = useCart();
  const quantityInCart = getItemQuantity(item?._id);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError("");
        
        // 🔥 CHANGED: Use apiService.items.getById()
        const response = await apiService.items.getById(id);
        
        // Get the item data
        const responseData = response?.data;
        let itemData = null;
        
        if (responseData?.data) {
          itemData = responseData.data;
        } else if (responseData && typeof responseData === 'object' && responseData._id) {
          itemData = responseData;
        } else {
          itemData = response;
        }
        
        if (!itemData) {
          throw new Error('No item data received');
        }
        
        // 🔥 FIX: Ensure Cloudinary URL is available
        const itemWithImageURL = {
          ...itemData,
          // Make sure we have the Cloudinary URL
          imageURL: itemData.imageURL || itemData.image || null
        };
        
        // Set item state
        setItem(itemWithImageURL);
        
        // Check ownership
        if (user && itemData.owner) {
          const ownerId = itemData.owner._id?.toString() || itemData.owner.toString();
          const userId = user._id?.toString() || user.id?.toString() || user.toString();
          const isOwnerCheck = ownerId === userId;
          setIsOwner(isOwnerCheck);
          setIsOwnItem(isOwnerCheck);
        }
        
        // Check admin status
        if (user?.role === 'admin') {
          setIsAdmin(true);
        }
        
      } catch (err) {
        console.error("❌ Error fetching item:", err);
        
        const errorMessage = err.response?.data?.message || err.message || "Failed to load item";
        
        if (err.response?.status === 403) {
          setError("Access denied. This item may be private or pending approval.");
        } else if (err.response?.status === 404) {
          setError("Item not found. It may have been deleted.");
        } else if (err.response?.status === 401) {
          setError("Please log in to view this item.");
        } else if (err.message === "Network Error") {
          setError("Cannot connect to server. Please check if backend is running.");
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
      setBarterError("You cannot barter with your own item");
      setTimeout(() => setBarterError(""), 3000);
      return;
    }

    setBarterLoading(true);
    setBarterError("");
    setBarterSuccess("");

    try {
      // 🔥 CHANGED: Use apiService.barter.create()
      await apiService.barter.create({
        itemId: item._id,
        message: `I'm interested in bartering for your ${item.title}`
      });

      setBarterSuccess("Barter request sent!");
      
      setTimeout(() => {
        setBarterSuccess("");
      }, 5000);

    } catch (error) {
      console.error("❌ Error sending barter request:", error);
      
      const errorMsg = error.response?.data?.message || 
                      error.message || 
                      "Failed to send barter request";
      setBarterError(errorMsg);
      
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
      // 🔥 CHANGED: Use apiService.items.delete()
      await apiService.items.delete(id);
      alert("Item deleted successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Error deleting item:", err);
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
      <div style={{ maxWidth: "1200px", margin: "40px auto", textAlign: "center", padding: "60px" }}>
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
      <div style={{ maxWidth: "1200px", margin: "40px auto", textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#e63946", marginBottom: "16px", fontSize: "24px" }}>Error Loading Item</h2>
        <p style={{ color: "#6c757d", marginBottom: "30px", fontSize: "16px", lineHeight: "1.6" }}>{error}</p>
        
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ 
              padding: "12px 24px",
              background: "transparent",
              border: "2px solid #4361ee",
              color: "#4361ee",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
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
            Go Back
          </button>
          
          <button 
            onClick={() => navigate("/")}
            style={{ 
              padding: "12px 24px",
              background: "#4361ee",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            Browse Items
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ maxWidth: "1200px", margin: "40px auto", textAlign: "center", padding: "60px" }}>
        <h2 style={{ marginBottom: "16px", fontSize: "24px", color: "#212529" }}>Item Not Found</h2>
        <p style={{ color: "#6c757d", marginBottom: "30px", fontSize: "16px" }}>
          The item you're looking for doesn't exist or has been removed.
        </p>
        <button 
          onClick={() => navigate("/")}
          style={{ 
            padding: "12px 24px",
            background: "#4361ee",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            transition: "all 0.3s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          Browse Items
        </button>
      </div>
    );
  }

  // Helper function to check if item is approved
  const isItemApproved = () => {
    if (item.isApproved === true || item.isApproved === 'true') return true;
    if (item.isApproved === false || item.isApproved === 'false') return false;
    return Boolean(item.isApproved);
  };

  // Helper function to check if item is flagged
  const isItemFlagged = () => {
    if (item.isFlagged === true || item.isFlagged === 'true') return true;
    if (item.isFlagged === false || item.isFlagged === 'false') return false;
    return Boolean(item.isFlagged);
  };

    // Add this function:
const handleAddToCart = () => {
  if (!item) return;
  
  if (item.status !== 'Available') {
    alert(`This item is ${item.status}. Cannot add to cart.`);
    return;
  }
  
  setIsAddingToCart(true);
  addToCart(item);
  
  setTimeout(() => {
    setIsAddingToCart(false);
  }, 1000);
};

  // 🔥 SIMPLIFIED: Get Cloudinary URL directly
  const getImageUrl = () => {
    return item.imageURL || item.image || null;
  };

  const imageUrl = getImageUrl();
  const approved = isItemApproved();
  const flagged = isItemFlagged();

  return (
    <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px" }}>
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
          background: barterSuccess ? "#28a745" : "#dc3545",
          boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center"
        }}>
          {barterSuccess ? "✅ " : "❌ "}{barterSuccess || barterError}
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
            ×
          </button>
        </div>
      )}

      {/* Owner/Admin Actions Section */}
      {(isOwner || isAdmin) && (
        <div style={{
          background: "#f8f9fa",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          borderLeft: "5px solid #4361ee"
        }}>
          <h3 style={{ marginBottom: "15px", color: "#212529" }}>
            {isAdmin && !isOwner ? "Admin Controls" : "Manage Your Item"}
          </h3>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            {isOwner && (
              <button
                onClick={handleEdit}
                style={{
                  padding: "12px 24px",
                  background: "transparent",
                  border: "2px solid #4361ee",
                  color: "#4361ee",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
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
                Edit Item
              </button>
            )}
            
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: "12px 24px",
                background: deleting ? "#6c757d" : "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.7 : 1,
                fontWeight: "600",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => {
                if (!deleting) {
                  e.target.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!deleting) {
                  e.target.style.transform = "translateY(0)";
                }
              }}
            >
              {deleting ? "Deleting..." : "Delete Item"}
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "50px", 
        '@media (max-width: 768px)': { gridTemplateColumns: "1fr" } 
      }}>
        {/* Left Column - Image */}
        <div>
          {imageUrl ? (
            <div style={{ position: "relative" }}>
              <img
                src={imageUrl}
                alt={item.title || 'Item'}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  maxHeight: "500px",
                  objectFit: "cover",
                  transition: "all 0.3s"
                }}
                onError={(e) => {
                  console.log('Image failed to load, showing fallback');
                  e.target.style.display = 'none';
                  
                  const fallback = document.createElement('div');
                  fallback.style.cssText = `
                    width: 100%;
                    height: 400px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    border: 2px dashed rgba(255,255,255,0.3);
                    text-align: center;
                  `;
                  
                  fallback.innerHTML = `
                    <div style="font-size: 48px; margin-bottom: 10px;">📚</div>
                    <div style="font-weight: 600; margin-bottom: 5px;">Image Not Available</div>
                    <div style="font-size: 14px; opacity: 0.8;">Cloudinary Image Load Failed</div>
                  `;
                  
                  e.target.parentNode.appendChild(fallback);
                }}
                onLoad={(e) => {
                  e.target.style.opacity = "1";
                }}
              />
              
              {/* Image Loading Indicator */}
              <div style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "500"
              }}>
                📷 Cloudinary
              </div>
            </div>
          ) : (
            <div style={{
              width: "100%",
              height: "400px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              border: "2px dashed rgba(255,255,255,0.3)",
              flexDirection: "column",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>📚</div>
              <div style={{ fontWeight: "600", marginBottom: "5px" }}>No Image Available</div>
              <div style={{ fontSize: "14px", opacity: 0.8 }}>This item has no image</div>
            </div>
          )}
          
          <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
            <Link 
              to={`/chat/${item._id}`}
              style={{ 
                flex: 1, 
                padding: "16px 24px", 
                background: "linear-gradient(135deg, #4361ee, #7209b7)",
                color: "white",
                textDecoration: "none",
                textAlign: "center",
                borderRadius: "6px",
                fontWeight: "600",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Chat About Item
            </Link>
            
            <Link 
              to={`/reviews/${item._id}`}
              style={{ 
                flex: 1, 
                padding: "16px 24px", 
                background: "transparent",
                color: "#4361ee",
                textDecoration: "none",
                textAlign: "center",
                borderRadius: "6px",
                border: "2px solid #4361ee",
                fontWeight: "600",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#4361ee";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#4361ee";
              }}
            >
              View Reviews
            </Link>
          </div>
        </div>

        {/* Right Column - Details */}
        <div>
          <div style={{ marginBottom: "30px" }}>
            {/* Item Status Badge */}
            <div style={{ marginBottom: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {!approved ? (
                <span style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #ffd166, #ff9e00)",
                  color: "#212529",
                  padding: "8px 20px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "600",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}>
                  ⏳ Pending Approval
                </span>
              ) : flagged ? (
                <span style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #ff6b6b, #e63946)",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "600",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}>
                  ⚠️ Flagged
                </span>
              ) : (
                <span style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #38b000, #2d9100)",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "600",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}>
                  ✅ Approved
                </span>
              )}
              
              {/* Status badge */}
              {item.status && (
                <span style={{
                  display: "inline-block",
                  background: "#eef2ff",
                  color: "#4361ee",
                  padding: "8px 20px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "1px solid #dee2e6"
                }}>
                  {item.status}
                </span>
              )}
            </div>
            
            <h1 style={{ 
              fontSize: "2rem", 
              marginBottom: "16px",
              color: "#212529",
              lineHeight: 1.2
            }}>
              {item.title || "Untitled Item"}
            </h1>
            
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
              <span style={{ 
                fontSize: "28px", 
                fontWeight: "700", 
                background: "linear-gradient(135deg, #4361ee, #7209b7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                ₹ {item.price || "0"}
              </span>
              
              {item.category && (
                <span style={{
                  display: "inline-block",
                  background: "#eef2ff",
                  color: "#4361ee",
                  padding: "6px 12px",
                  borderRadius: "4px",
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
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>
                  {item.condition}
                </span>
              )}
            </div>
            
            <div style={{ 
              padding: "20px", 
              background: "#f8f9fa", 
              borderRadius: "8px",
              marginBottom: "30px"
            }}>
              <h3 style={{ 
                marginBottom: "12px", 
                fontSize: "16px", 
                color: "#212529",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span>📝</span> Description
              </h3>
              <p style={{ 
                fontSize: "15px", 
                lineHeight: 1.6, 
                color: "#495057",
                margin: 0,
                whiteSpace: "pre-wrap"
              }}>
                {item.description || "No description available for this item."}
              </p>
            </div>
            
            <div style={{ 
              padding: "20px", 
              background: "linear-gradient(135deg, #4361ee, #7209b7)",
              color: "white",
              borderRadius: "8px",
              marginBottom: "30px"
            }}>
              <h3 style={{ 
                marginBottom: "12px", 
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span>👤</span> Seller Information
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: "bold"
                }}>
                  {item.owner?.name?.charAt(0) || "S"}
                </div>
                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>
                    {item.owner?.name || "Seller"}
                  </p>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: "14px" }}>
                    {item.owner?.email || "Contact via chat"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          // In the "Additional Actions" section, add the Add to Cart button:
<div style={{ display: "flex", gap: "15px", marginTop: "30px", flexWrap: "wrap" }}>
  {/* Add to Cart Button - ADD THIS */}
  <button 
    onClick={handleAddToCart}
    disabled={isAddingToCart || item?.status !== 'Available'}
    style={{ 
      flex: 1, 
      padding: "16px 24px",
      background: isAddingToCart 
        ? "#28a745" 
        : (item?.status === 'Available' 
            ? "linear-gradient(135deg, #20c997, #109f7d)" 
            : "#6c757d"),
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: item?.status === 'Available' ? "pointer" : "not-allowed",
      opacity: isAddingToCart ? 0.8 : 1,
      transition: "all 0.3s",
      minWidth: "200px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px"
    }}
    onMouseEnter={(e) => {
      if (item?.status === 'Available' && !isAddingToCart) {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(32, 201, 151, 0.3)";
      }
    }}
    onMouseLeave={(e) => {
      if (item?.status === 'Available' && !isAddingToCart) {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }
    }}
  >
    {isAddingToCart ? (
      <>
        <div style={{
          display: "inline-block",
          width: "16px",
          height: "16px",
          border: "2px solid white",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          verticalAlign: "middle"
        }}></div>
        Adding...
      </>
    ) : item?.status === 'Available' ? (
      quantityInCart > 0 ? `🛒 Add More (${quantityInCart} in cart)` : "🛒 Add to Cart"
    ) : (
      `❌ ${item?.status}`
    )}
  </button>
  
  {/* Keep your existing Request Barter button and other buttons */}
  {!isOwnItem && (
    <button 
      onClick={handleBarterRequest}
      disabled={barterLoading}
      style={{ 
        flex: 1, 
        padding: "16px 24px",
        background: barterLoading 
          ? "#6c757d" 
          : "linear-gradient(135deg, #38b000, #2d9100)",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: barterLoading ? "not-allowed" : "pointer",
        opacity: barterLoading ? 0.7 : 1,
        transition: "all 0.3s",
        minWidth: "200px"
      }}
      onMouseEnter={(e) => {
        if (!barterLoading) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(56, 176, 0, 0.3)";
        }
      }}
      onMouseLeave={(e) => {
        if (!barterLoading) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {barterLoading ? (
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
          Sending...
        </>
      ) : (
        "🔄 Request Barter"
      )}
    </button>
  )}
            
            <button 
              onClick={() => alert("Added to favorites!")}
              style={{ 
                padding: "16px 24px", 
                background: "transparent",
                border: "2px solid #dee2e6",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#fff3cd";
                e.target.style.borderColor = "#ffc107";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.borderColor = "#dee2e6";
              }}
            >
              ❤️ Add to Favorites
            </button>
            
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
              }}
              style={{ 
                padding: "16px 24px", 
                background: "transparent",
                border: "2px solid #dee2e6",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#e7f5ff";
                e.target.style.borderColor = "#0d6efd";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.borderColor = "#dee2e6";
              }}
            >
              📤 Share
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
        
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ItemDetails;