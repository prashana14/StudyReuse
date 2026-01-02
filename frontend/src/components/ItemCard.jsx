import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const ItemCard = ({ item }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Available': return '#28a745';
      case 'Sold': return '#dc3545';
      case 'Under Negotiation': return '#ffc107';
      case 'Unavailable': return '#6c757d';
      default: return '#6c757d';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch(status) {
      case 'Available': return 'AVAILABLE';
      case 'Sold': return 'SOLD';
      case 'Under Negotiation': return 'NEGOTIATION';
      case 'Unavailable': return 'UNAVAILABLE';
      default: return 'UNKNOWN';
    }
  };

  // ✅ SIMPLIFIED: Use Cloudinary URL directly
  const imageUrl = item.imageURL || item.image; // Cloudinary provides full URL

  useEffect(() => {
  if (!imageUrl || imageUrl.trim() === '') {
    setHasError(true);
    setIsLoading(false);
    return;
  }
  
  setIsLoading(true);
  setHasError(false);
  
  // Check if it's a Cloudinary URL
  const isCloudinaryUrl = imageUrl.includes('cloudinary.com');
  
  if (isCloudinaryUrl) {
    // Cloudinary URLs are reliable, preload for better UX
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
    
    // Add timeout for safety
    setTimeout(() => {
      if (!img.complete) {
        // Still try to show the image (Cloudinary might be slow)
        setImageSrc(imageUrl);
        setIsLoading(false);
      }
    }, 2000);
  } else {
    // Handle non-Cloudinary URLs (legacy)
    setImageSrc(imageUrl);
    setIsLoading(false);
  }
}, [imageUrl]);

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

  // Get placeholder background based on category
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
        border: "1px solid #eaeaea"
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
        
        {/* Status Badge - TOP LEFT */}
        {item.status && (
          <div style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: getStatusColor(item.status),
            color: "white",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: "600",
            letterSpacing: "0.5px"
          }}>
            {getStatusText(item.status)}
          </div>
        )}
        
        {/* Category Badge - TOP RIGHT */}
        {item.category && (
          <div style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: "600",
            color: "#495057",
            border: "1px solid #dee2e6"
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
        flexDirection: "column"
      }}>
        {/* Title */}
        <h5 
          style={{ 
            fontSize: "16px", 
            fontWeight: "600",
            marginBottom: "8px",
            color: "#212529",
            lineHeight: "1.4"
          }}
        >
          {truncateTitle(item.title)}
        </h5>
        
        {/* Price */}
        <div style={{ marginTop: "auto" }}>
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
            color: "#4361ee",
            marginBottom: "12px"
          }}>
            {formatPrice(item.price)}
          </div>
        </div>
        
        {/* Condition */}
        {item.condition && (
          <div style={{
            marginBottom: "12px"
          }}>
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
              color: "#495057"
            }}>
              {formatCondition(item.condition)}
            </div>
          </div>
        )}
        
        {/* Owner Info (if available) */}
        {item.owner && typeof item.owner === 'object' && item.owner.name && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            fontSize: "12px",
            color: "#6c757d"
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
            transition: "background 0.2s",
            color: "white",
            textDecoration: "none",
            textAlign: "center",
            display: "block",
            fontSize: "13px"
          }}
          onMouseEnter={(e) => e.target.style.background = "#3a56d4"}
          onMouseLeave={(e) => e.target.style.background = "#4361ee"}
        >
          View Details
        </Link>
      </div>
      
      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ItemCard;