import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartProvider";

const ItemCard = ({ item }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart, getItemQuantity } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  
  // Get quantity in cart
  const quantityInCart = getItemQuantity(item._id);
  
  // Calculate available quantity
  const availableQuantity = item.quantity || 0;
  const canAddToCart = item.status === 'Available' && 
                      availableQuantity > 0 && 
                      quantityInCart < availableQuantity;

  // Get status color - UPDATED
  const getStatusColor = (status, quantity) => {
    if (quantity <= 0) return '#dc3545'; // Red for sold out
    switch(status) {
      case 'Available': return '#28a745';
      case 'Sold': return '#dc3545';
      case 'Sold Out': return '#dc3545';
      case 'Under Negotiation': return '#ffc107';
      case 'Unavailable': return '#6c757d';
      default: return '#6c757d';
    }
  };

  // Get status text - UPDATED
  const getStatusText = (status, quantity) => {
    if (quantity <= 0) return 'SOLD OUT';
    switch(status) {
      case 'Available': return 'AVAILABLE';
      case 'Sold': return 'SOLD';
      case 'Sold Out': return 'SOLD OUT';
      case 'Under Negotiation': return 'NEGOTIATION';
      case 'Unavailable': return 'UNAVAILABLE';
      default: return 'UNKNOWN';
    }
  };

  // Get availability badge - NEW
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

  // Image URL handling
  const imageUrl = item.imageURL || item.image;

  useEffect(() => {
    if (!imageUrl || imageUrl.trim() === '') {
      setHasError(true);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    
    const isCloudinaryUrl = imageUrl.includes('cloudinary.com');
    
    if (isCloudinaryUrl) {
      const img = new Image();
      img.src = imageUrl;
      
      img.onload = () => {
        setImageSrc(imageUrl);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
      
      setTimeout(() => {
        if (!img.complete) {
          setImageSrc(imageUrl);
          setIsLoading(false);
        }
      }, 2000);
    } else {
      setImageSrc(imageUrl);
      setIsLoading(false);
    }
  }, [imageUrl]);

  // Add to cart handler - UPDATED
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    
    setIsAdding(true);
    addToCart(item);
    
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  // Get category icon text
  const getPlaceholderText = () => {
    const category = (item.category || '').toLowerCase();
    
    if (category.includes('book')) return 'BOOK';
    if (category.includes('notes')) return 'NOTES';
    if (category.includes('electron')) return 'ELECTRONICS';
    if (category.includes('lab equipment')) return 'LAB EQUIP';
    if (category.includes('study guides')) return 'GUIDES';
    if (category.includes('stationery')) return 'STATIONERY';
    if (category.includes('furniture')) return 'FURNITURE';
    if (category.includes('others')) return 'ITEM';
    
    return 'ITEM';
  };

  // Get placeholder background
  const getPlaceholderBackground = () => {
    const category = (item.category || '').toLowerCase();
    
    if (category.includes('book') || category.includes('text')) 
      return '#4a6bff';
    if (category.includes('electron') || category.includes('laptop')) 
      return '#ff6b6b';
    if (category.includes('furniture') || category.includes('chair')) 
      return '#20c997';
    if (category.includes('stationery') || category.includes('pen')) 
      return '#7950f2';
    if (category.includes('lab equipment')) 
      return '#fd7e14';
    
    return '#4361ee';
  };

  // Format price
  const formatPrice = (price) => {
    if (!price && price !== 0) return "Free";
    
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return "Free";
    
    if (numPrice === 0) return "Free";
    
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  // Truncate title
  const truncateTitle = (title, maxLength = 50) => {
    if (!title) return "Untitled Item";
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  // Format condition text
  const formatCondition = (condition) => {
    if (!condition) return '';
    
    const conditionMap = {
      'new': 'Brand New',
      'like_new': 'Like New',
      'good': 'Good',
      'fair': 'Fair',
      'needs_repair': 'Needs Repair'
    };
    
    return conditionMap[condition] || condition;
  };

  const availabilityBadge = getAvailabilityBadge();

  return (
    <div 
      className="card m-2 shadow-sm" 
      style={{ 
        width: "100%",
        maxWidth: "300px",
        minWidth: "280px",
        transition: "transform 0.3s, box-shadow 0.3s",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: "1px solid #eaeaea",
        position: "relative"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
      }}
    >
      {/* Quantity in cart badge */}
      {quantityInCart > 0 && (
        <div style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "linear-gradient(135deg, #4361ee, #7209b7)",
          color: "white",
          padding: "3px 8px",
          borderRadius: "4px",
          fontSize: "10px",
          fontWeight: "600",
          letterSpacing: "0.5px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "3px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
        }}>
          <span>🛒</span> {quantityInCart} in cart
        </div>
      )}

      {/* Availability Badge - NEW */}
      <div style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        background: availabilityBadge.bgColor,
        color: availabilityBadge.color,
        padding: "3px 8px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: "600",
        letterSpacing: "0.5px",
        zIndex: 10,
        border: `1px solid ${availabilityBadge.color}20`
      }}>
        {availabilityBadge.text}
      </div>

      {/* Image Container */}
      <div style={{ 
        height: "180px", 
        width: "100%",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#f8f9fa"
      }}>
        {/* Loading State */}
        {isLoading && (
          <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8f9fa"
          }}>
            <div style={{
              width: "30px",
              height: "30px",
              border: "2px solid #e0e0e0",
              borderTop: "2px solid #4361ee",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
          </div>
        )}
        
        {/* Actual Image */}
        {!isLoading && imageSrc && !hasError && (
          <img
            src={imageSrc}
            alt={item.title}
            style={{ 
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              setHasError(true);
            }}
            loading="lazy"
          />
        )}
        
        {/* Fallback/Placeholder */}
        {!isLoading && (!imageSrc || hasError) && (
          <div
            style={{ 
              width: "100%",
              height: "100%",
              background: getPlaceholderBackground(),
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <div style={{ 
              fontSize: "14px",
              fontWeight: "600",
              letterSpacing: "1px",
              textTransform: "uppercase"
            }}>
              {getPlaceholderText()}
            </div>
          </div>
        )}
        
        {/* Category Badge - BOTTOM RIGHT */}
        {item.category && (
          <div style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: "600",
            color: "#495057",
            border: "1px solid #dee2e6",
            zIndex: 10
          }}>
            {item.category.length > 12 ? item.category.substring(0, 12) + '...' : item.category}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div style={{ 
        padding: "16px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}>
        {/* Title */}
        <h5 
          style={{ 
            fontSize: "16px", 
            fontWeight: "600",
            marginBottom: "4px",
            color: "#212529",
            lineHeight: "1.4",
            minHeight: "44px"
          }}
        >
          {truncateTitle(item.title)}
        </h5>
        
        {/* Price and Condition Row */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "5px"
        }}>
          {/* Price */}
          <div>
            <div style={{ 
              fontSize: "11px", 
              color: "#6c757d",
              fontWeight: "500",
              marginBottom: "2px"
            }}>
              PRICE
            </div>
            <div style={{ 
              fontSize: "20px", 
              fontWeight: "700", 
              color: "#4361ee"
            }}>
              {formatPrice(item.price)}
            </div>
          </div>
          
          {/* Condition */}
          {item.condition && (
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: "11px",
                color: "#6c757d",
                fontWeight: "500",
                marginBottom: "2px"
              }}>
                CONDITION
              </div>
              <div style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#495057",
                background: "#eef2ff",
                padding: "4px 8px",
                borderRadius: "4px"
              }}>
                {formatCondition(item.condition)}
              </div>
            </div>
          )}
        </div>
        
        {/* Quantity Info - NEW */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px",
          background: "#f8f9fa",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#495057"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "14px" }}>📦</span>
            <span>Stock:</span>
          </div>
          <div style={{ 
            fontWeight: "600",
            color: availableQuantity > 0 ? "#28a745" : "#dc3545"
          }}>
            {availableQuantity > 0 ? `${availableQuantity} units` : 'Out of stock'}
          </div>
        </div>
        
        {/* Owner Info */}
        {item.owner && typeof item.owner === 'object' && item.owner.name && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "5px",
            fontSize: "12px",
            color: "#6c757d",
            padding: "8px",
            background: "#f8f9fa",
            borderRadius: "6px"
          }}>
            <div style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "#e9ecef",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: "600",
              color: "#495057"
            }}>
              {item.owner.name.charAt(0).toUpperCase()}
            </div>
            <span>{item.owner.name.split(' ')[0]}</span>
          </div>
        )}
        
        {/* Buttons Container */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          gap: "8px",
          marginTop: "auto"
        }}>
          {/* View Details Button */}
          <Link 
            to={`/item/${item._id}`} 
            style={{ 
              width: "100%",
              background: "#4361ee",
              border: "none",
              borderRadius: "6px",
              padding: "10px",
              fontWeight: "600",
              transition: "all 0.3s",
              color: "white",
              textDecoration: "none",
              textAlign: "center",
              display: "block",
              fontSize: "13px"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#3a56d4";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#4361ee";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            View Details
          </Link>
          
          {/* Add to Cart Button - UPDATED */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || !canAddToCart}
            style={{ 
              width: "100%",
              background: isAdding ? "#28a745" : (canAddToCart ? "#20c997" : "#6c757d"),
              border: "none",
              borderRadius: "6px",
              padding: "10px",
              fontWeight: "600",
              transition: "all 0.3s",
              color: "white",
              cursor: canAddToCart ? "pointer" : "not-allowed",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              opacity: (isAdding || canAddToCart) ? 1 : 0.7
            }}
            onMouseEnter={(e) => {
              if (canAddToCart && !isAdding) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (canAddToCart && !isAdding) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }
            }}
          >
            {isAdding ? (
              <>
                <div style={{
                  width: "12px",
                  height: "12px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite"
                }}></div>
                Adding...
              </>
            ) : canAddToCart ? (
              quantityInCart > 0 ? (
                <>
                  <span>🛒</span> Add More ({quantityInCart} in cart)
                </>
              ) : (
                <>
                  <span>🛒</span> Add to Cart
                </>
              )
            ) : availableQuantity <= 0 ? (
              '❌ Sold Out'
            ) : (
              `❌ ${item.status}`
            )}
          </button>
        </div>
      </div>
      
      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 480px) {
          .card {
            min-width: 250px !important;
            max-width: 100% !important;
          }
          
          .card h5 {
            font-size: 14px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ItemCard;