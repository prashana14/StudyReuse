import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiService from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartProvider";

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
  const [showBarterModal, setShowBarterModal] = useState(false);
  const [offerItems, setOfferItems] = useState([]);
  const [selectedOfferItemId, setSelectedOfferItemId] = useState("");
  const [barterMessage, setBarterMessage] = useState("");

  const { addToCart, getItemQuantity } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // NEW: State for quantity management
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [quantityInCart, setQuantityInCart] = useState(0);
  const [canAddToCart, setCanAddToCart] = useState(false);
  const [showQuantityInfo, setShowQuantityInfo] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await apiService.items.getById(id);
        
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
        
        const itemWithImageURL = {
          ...itemData,
          imageURL: itemData.imageURL || itemData.image || null
        };
        
        setItem(itemWithImageURL);
        
        // NEW: Calculate quantity information
        const itemQuantity = itemData.quantity || 0;
        setAvailableQuantity(itemQuantity);
        
        if (user && itemData.owner) {
          const ownerId = itemData.owner._id?.toString() || itemData.owner.toString();
          const userId = user._id?.toString() || user.id?.toString() || user.toString();
          const isOwnerCheck = ownerId === userId;
          setIsOwner(isOwnerCheck);
          setIsOwnItem(isOwnerCheck);
        }
        
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

  // NEW: Update cart quantity whenever item or cart changes
  useEffect(() => {
    if (item) {
      const cartQty = getItemQuantity(item._id);
      setQuantityInCart(cartQty);
      
      // Check if we can add more to cart
      const canAdd = item.status === 'Available' && 
                    availableQuantity > 0 && 
                    cartQty < availableQuantity;
      setCanAddToCart(canAdd);
      
      // Show quantity info if low stock or in cart
      const shouldShowInfo = availableQuantity <= 3 || cartQty > 0;
      setShowQuantityInfo(shouldShowInfo);
    }
  }, [item, availableQuantity, getItemQuantity]);

  // Fetch user's available items for barter
  const fetchUserItemsForBarter = async () => {
    if (!isAuthenticated) {
      alert("Please login to request barter");
      navigate('/login');
      return false;
    }

    if (isOwnItem) {
      setBarterError("You cannot barter with your own item");
      setTimeout(() => setBarterError(""), 3000);
      return false;
    }

    setBarterLoading(true);
    
    try {
      const response = await apiService.items.getMyItems();
      
      let userItems = [];
      
      if (Array.isArray(response)) {
        userItems = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          userItems = response.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          userItems = response.data.items;
        }
      } else if (response?.items && Array.isArray(response.items)) {
        userItems = response.items;
      }
      
      // Filter items that are available and not the current item
      const availableItems = userItems.filter(userItem => {
        if (!userItem || !userItem._id) return false;
        if (userItem._id === id) return false;
        
        const isAvailable = userItem.status === 'Available' || userItem.status === 'available';
        const isApproved = userItem.isApproved === true || 
                          !userItem.isApproved;
        
        return isAvailable && isApproved;
      });
      
      setOfferItems(availableItems);
      
      if (availableItems.length === 0) {
        setBarterError("You don't have any items available for barter. Add items first!");
        setTimeout(() => setBarterError(""), 5000);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("❌ Error fetching user items:", error);
      const errorMsg = error.response?.data?.message || 
                      error.message || 
                      "Failed to load your items. Please try again.";
      setBarterError(errorMsg);
      setTimeout(() => setBarterError(""), 5000);
      return false;
    } finally {
      setBarterLoading(false);
    }
  };

  // Open barter modal
  const openBarterModal = async () => {
    const hasItems = await fetchUserItemsForBarter();
    if (hasItems) {
      setShowBarterModal(true);
      setSelectedOfferItemId(offerItems[0]?._id || "");
    }
  };

  // Barter Request Function
  const handleBarterRequest = async () => {
    if (!selectedOfferItemId) {
      setBarterError("Please select an item to offer in exchange");
      setTimeout(() => setBarterError(""), 3000);
      return;
    }

    setBarterLoading(true);
    setBarterError("");
    setBarterSuccess("");

    try {
      await apiService.barter.create({
        itemId: item._id,
        offerItemId: selectedOfferItemId,
        message: barterMessage || `I'm interested in bartering for your "${item.title}"`
      });

      setBarterSuccess("Barter request sent successfully!");
      setShowBarterModal(false);
      setBarterMessage("");
      
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

  // UPDATED: Add to cart with quantity validation
  const handleAddToCart = () => {
    if (!item) return;
    
    if (!canAddToCart) {
      if (availableQuantity <= 0) {
        alert('This item is sold out.');
      } else if (quantityInCart >= availableQuantity) {
        alert(`Cannot add more. Only ${availableQuantity} available.`);
      } else {
        alert(`Item is ${item.status}. Cannot add to cart.`);
      }
      return;
    }
    
    setIsAddingToCart(true);
    addToCart(item);
    
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 1000);
  };

  // NEW: Get availability badge style
  const getAvailabilityBadge = () => {
    if (availableQuantity <= 0) {
      return {
        text: 'SOLD OUT',
        color: '#dc3545',
        bgColor: '#f8d7da'
      };
    }
    
    if (availableQuantity <= 3) {
      return {
        text: `ONLY ${availableQuantity} LEFT`,
        color: '#ff6b6b',
        bgColor: '#fff5f5'
      };
    }
    
    return {
      text: `${availableQuantity} AVAILABLE`,
      color: '#28a745',
      bgColor: '#d4edda'
    };
  };

  // Loading state
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

  const isItemApproved = () => {
    if (item.isApproved === true || item.isApproved === 'true') return true;
    if (item.isApproved === false || item.isApproved === 'false') return false;
    return Boolean(item.isApproved);
  };

  const isItemFlagged = () => {
    if (item.isFlagged === true || item.isFlagged === 'true') return true;
    if (item.isFlagged === false || item.isFlagged === 'false') return false;
    return Boolean(item.isFlagged);
  };

  const getImageUrl = () => {
    return item.imageURL || item.image || null;
  };

  const imageUrl = getImageUrl();
  const approved = isItemApproved();
  const flagged = isItemFlagged();
  const availabilityBadge = getAvailabilityBadge();

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
          zIndex: 1001,
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

      {/* Barter Modal */}
      {showBarterModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "30px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "20px" 
            }}>
              <h2 style={{ margin: 0, fontSize: "24px", color: "#212529" }}>Request Barter</h2>
              <button 
                onClick={() => setShowBarterModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6c757d"
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ marginBottom: "10px", color: "#495057", fontWeight: "500" }}>
                Item you want: <strong>{item.title}</strong>
              </p>
              <p style={{ color: "#6c757d", fontSize: "14px" }}>
                Select one of your items to offer in exchange:
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#212529" }}>
                Select your item to offer:
              </label>
              <select
                value={selectedOfferItemId}
                onChange={(e) => setSelectedOfferItemId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #dee2e6",
                  borderRadius: "6px",
                  fontSize: "16px",
                  marginBottom: "20px"
                }}
              >
                <option value="">-- Select an item --</option>
                {offerItems.map(offerItem => (
                  <option key={offerItem._id} value={offerItem._id}>
                    {offerItem.title} (₹{offerItem.price || "0"})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#212529" }}>
                Message to seller (optional):
              </label>
              <textarea
                value={barterMessage}
                onChange={(e) => setBarterMessage(e.target.value)}
                placeholder={`I'd like to offer my item in exchange for your "${item.title}"`}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #dee2e6",
                  borderRadius: "6px",
                  fontSize: "16px",
                  minHeight: "100px",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "15px" }}>
              <button
                onClick={handleBarterRequest}
                disabled={barterLoading || !selectedOfferItemId}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  background: barterLoading ? "#6c757d" : "#38b000",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: barterLoading || !selectedOfferItemId ? "not-allowed" : "pointer",
                  opacity: barterLoading || !selectedOfferItemId ? 0.7 : 1
                }}
              >
                {barterLoading ? "Sending Request..." : "Send Barter Request"}
              </button>
              
              <button
                onClick={() => setShowBarterModal(false)}
                style={{
                  padding: "14px 20px",
                  background: "transparent",
                  border: "2px solid #dee2e6",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "50px" }}>
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
              
              {/* NEW: Availability Badge */}
              <span style={{
                display: "inline-block",
                background: availabilityBadge.bgColor,
                color: availabilityBadge.color,
                padding: "8px 20px",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "600",
                border: `1px solid ${availabilityBadge.color}20`
              }}>
                {availabilityBadge.text}
              </span>
              
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
                Rs. {item.price || "0"}
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
            
            {/* NEW: Quantity Information Section */}
            {showQuantityInfo && (
              <div style={{ 
                padding: "15px", 
                background: "#f8f9fa", 
                borderRadius: "8px",
                marginBottom: "20px",
                borderLeft: "4px solid #4361ee"
              }}>
                <h3 style={{ 
                  marginBottom: "10px", 
                  fontSize: "16px", 
                  color: "#212529",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span>📦</span> Stock Information
                </h3>
                <div style={{ 
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontSize: "14px", color: "#6c757d" }}>
                      Available:
                    </div>
                    <div style={{ 
                      fontSize: "20px", 
                      fontWeight: "600",
                      color: availableQuantity > 0 ? "#28a745" : "#dc3545"
                    }}>
                      {availableQuantity > 0 ? `${availableQuantity} units` : 'Out of stock'}
                    </div>
                  </div>
                  
                  {quantityInCart > 0 && (
                    <div style={{ 
                      background: "linear-gradient(135deg, #4361ee, #7209b7)",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}>
                      {quantityInCart} in your cart
                    </div>
                  )}
                </div>
                
                {availableQuantity <= 3 && availableQuantity > 0 && (
                  <div style={{
                    marginTop: "10px",
                    padding: "8px 12px",
                    background: "#fff3cd",
                    border: "1px solid #ffc107",
                    borderRadius: "4px",
                    fontSize: "13px",
                    color: "#856404",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                  </div>
                )}
              </div>
            )}
            
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

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "15px", marginTop: "30px", flexWrap: "wrap" }}>
            {/* UPDATED: Add to Cart Button with quantity validation */}
            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart || !canAddToCart}
              style={{ 
                flex: 1, 
                padding: "16px 24px",
                background: isAddingToCart 
                  ? "#28a745" 
                  : (canAddToCart 
                      ? "linear-gradient(135deg, #20c997, #109f7d)" 
                      : "#6c757d"),
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: canAddToCart ? "pointer" : "not-allowed",
                opacity: (isAddingToCart || canAddToCart) ? 1 : 0.7,
                transition: "all 0.3s",
                minWidth: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (canAddToCart && !isAddingToCart) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(32, 201, 151, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (canAddToCart && !isAddingToCart) {
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
              ) : canAddToCart ? (
                quantityInCart > 0 ? `🛒 Add More (${quantityInCart} in cart)` : "🛒 Add to Cart"
              ) : availableQuantity <= 0 ? (
                '❌ Sold Out'
              ) : (
                `❌ ${item.status}`
              )}
            </button>
            
            {/* Request Barter Button */}
            {!isOwnItem && (
              <button 
                onClick={openBarterModal}
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
                    Loading...
                  </>
                ) : (
                  "🔄 Request Barter"
                )}
              </button>
            )}
            
            {/* <button 
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
            </button> */}
            
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