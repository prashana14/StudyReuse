import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const ItemCard = ({ item }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Available': return '#10b981';
      case 'Sold': return '#ef4444';
      case 'Under Negotiation': return '#f59e0b';
      case 'Unavailable': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Available': return '✅';
      case 'Sold': return '💰';
      case 'Under Negotiation': return '🤝';
      case 'Unavailable': return '⏸️';
      default: return '📦';
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL
    if (imagePath.startsWith('http')) return imagePath;
    
    // If it starts with /uploads
    if (imagePath.startsWith('/uploads')) {
      return `http://localhost:4000${imagePath}`;
    }
    
    // If it's just a filename
    if (imagePath.includes('.')) {
      return `http://localhost:4000/uploads/${imagePath}`;
    }
    
    return null;
  };

  const imageUrl = item.imageURL || getImageUrl(item.image);

  useEffect(() => {
    if (imageUrl) {
      setIsLoading(true);
      setHasError(false);
      
      // Create a test image to check if it exists
      const testImage = new Image();
      
      testImage.onload = () => {
        console.log('✅ Image exists:', imageUrl);
        setImageSrc(imageUrl);
        setHasError(false);
        setIsLoading(false);
      };
      
      testImage.onerror = () => {
        console.warn('⚠️ Image not found, using fallback:', imageUrl);
        // Use a generic placeholder based on category
        setImageSrc(''); // Clear the URL to show fallback
        setHasError(true);
        setIsLoading(false);
      };
      
      testImage.src = imageUrl;
      
      // Set a timeout to prevent hanging if server doesn't respond
      const timeoutId = setTimeout(() => {
        if (!testImage.complete) {
          console.warn('⏰ Image load timeout:', imageUrl);
          setImageSrc('');
          setHasError(true);
          setIsLoading(false);
        }
      }, 3000); // 3 second timeout
      
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      // No image URL provided
      setImageSrc('');
      setHasError(true);
      setIsLoading(false);
    }
  }, [imageUrl]);

  // Get category-specific placeholder
  const getPlaceholderIcon = () => {
    const category = (item.category || '').toLowerCase();
    
    if (category.includes('book'));
    if (category.includes('notes'));
    if (category.includes('electron'));
    if (category.includes('lab equipment'));
    if (category.includes('study guides'));
    if (category.includes('stationery'));
    if (category.includes('reference book'));
    if (category.includes('others'));
    
    return '.'; // Default
  };

  // Get gradient based on category
  const getPlaceholderGradient = () => {
    const category = (item.category || '').toLowerCase();
    
    if (category.includes('book') || category.includes('text')) 
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    if (category.includes('electron') || category.includes('laptop')) 
      return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    if (category.includes('furniture') || category.includes('chair')) 
      return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    if (category.includes('cloth') || category.includes('wear')) 
      return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
    if (category.includes('stationery') || category.includes('pen')) 
      return 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)';
    
    return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
  };

  // Format price with Indian Rupees
  const formatPrice = (price) => {
    if (!price && price !== 0) return "Free";
    
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return "Free";
    
    if (numPrice === 0) return "Free";
    
    // Format with commas for Indian numbering system
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  // Truncate title if too long
  const truncateTitle = (title, maxLength = 50) => {
    if (!title) return "Untitled Item";
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div 
      className="card m-2 shadow-sm" 
      style={{ 
        width: "100%",
        maxWidth: "300px",
        minWidth: "280px",
        transition: "transform 0.3s, box-shadow 0.3s",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
    >
      {/* Image Container */}
      <div style={{ 
        height: "200px", 
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
              width: "40px",
              height: "40px",
              border: "3px solid #e0e0e0",
              borderTop: "3px solid #4361ee",
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
              objectFit: "cover",
              transition: "transform 0.5s"
            }}
            onError={(e) => {
              console.error(`Image failed to display: ${imageSrc}`);
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
              background: getPlaceholderGradient(),
              color: "white",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <div style={{ 
              fontSize: "48px",
              marginBottom: "10px",
              opacity: 0.9
            }}>
              {getPlaceholderIcon()}
            </div>
            <div style={{ 
              fontSize: "12px",
              opacity: 0.8,
              textAlign: "center",
              padding: "0 10px"
            }}>
              {item.category || "Item Image"}
            </div>
          </div>
        )}
        
        {/* Status Badge - TOP LEFT */}
        {item.status && (
          <div style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: getStatusColor(item.status),
            color: "white",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            zIndex: 10
          }}>
            <span>{getStatusIcon(item.status)}</span>
            <span>{item.status}</span>
          </div>
        )}
        
        {/* Category Badge - TOP RIGHT */}
        {item.category && (
          <div style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(4px)",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "600",
            color: "#4361ee",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            {item.category}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div style={{ 
        padding: "20px",
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Title */}
        <h5 
          style={{ 
            fontSize: "18px", 
            fontWeight: "600",
            marginBottom: "10px",
            color: "#212529",
            lineHeight: "1.4",
            flex: 1
          }}
        >
          {truncateTitle(item.title)}
        </h5>
        
        {/* Price */}
        <div style={{ marginTop: "auto" }}>
          <p 
            style={{ 
              fontSize: "12px", 
              color: "#6c757d",
              fontWeight: "500",
              marginBottom: "4px"
            }}
          >
            Price
          </p>
          <p 
            style={{ 
              fontSize: "24px", 
              fontWeight: "700", 
              color: "#4361ee",
              marginBottom: "20px"
            }}
          >
            {formatPrice(item.price)}
          </p>
        </div>
        
        {/* Condition (if available) */}
        {item.condition && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "15px",
            fontSize: "13px",
            color: "#6c757d"
          }}>
            <span>Condition:</span>
            <span style={{
              fontWeight: "600",
              color: "#4361ee",
              background: "#eef2ff",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "12px"
            }}>
              {item.condition}
            </span>
          </div>
        )}
        
        {/* View Details Button */}
        <Link 
          to={`/item/${item._id}`} 
          style={{ 
            width: "100%",
            background: "linear-gradient(135deg, #4361ee, #7209b7)",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            fontWeight: "600",
            transition: "all 0.3s",
            color: "white",
            textDecoration: "none",
            textAlign: "center",
            display: "block",
            fontSize: "14px"
          }}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.03)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
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