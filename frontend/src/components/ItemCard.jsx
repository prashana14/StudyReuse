import { Link } from "react-router-dom";
import { useState, useEffect } from "react"; // Add this import

const ItemCard = ({ item }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [hasError, setHasError] = useState(false);

  // Function to get correct image URL
 // components/ItemCard.jsx - Simplify getImageUrl function
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

  // Get the correct image URL
  const imageUrl = item.imageURL || getImageUrl(item.image);

  useEffect(() => {
    if (imageUrl) {
      console.log('📤 Setting image source:', imageUrl);
      setImageSrc(imageUrl);
      setHasError(false);
      
      // Pre-test the image URL
      const img = new Image();
      img.onload = () => console.log('✅ Image pre-load successful:', imageUrl);
      img.onerror = () => {
        console.error('❌ Image pre-load failed:', imageUrl);
        setHasError(true);
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

  console.log('🖼️ ItemCard Debug:', {
    id: item._id,
    title: item.title,
    imageField: item.image,
    imageURLField: item.imageURL,
    finalImageUrl: imageUrl,
    imageSrc: imageSrc,
    hasError: hasError
  });

  return (
    <div 
      className="card m-2 shadow-sm" 
      style={{ 
        width: "18rem", 
        transition: "transform 0.3s, box-shadow 0.3s",
        borderRadius: "12px",
        overflow: "hidden"
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
      {imageSrc && !hasError ? (
        <img
          src={imageSrc}
          alt={item.title}
          className="card-img-top"
          style={{ 
            height: "200px", 
            objectFit: "cover",
            transition: "transform 0.5s",
            backgroundColor: "#f8f9fa" // Background color while loading
          }}
          onError={(e) => {
            console.error(`❌ Image onError event: ${imageSrc}`);
            console.error('Error details:', {
              currentSrc: e.target.currentSrc,
              src: e.target.src
            });
            setHasError(true);
          }}
          onLoad={() => console.log(`✅ Image onLoad event: ${imageSrc}`)}
          loading="lazy" // Lazy loading for better performance
        />
      ) : (
        <div
          className="card-img-top d-flex align-items-center justify-content-center"
          style={{ 
            height: "200px", 
            background: hasError 
              ? "linear-gradient(135deg, #ff6b6b, #e63946)" 
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            fontSize: "48px"
          }}
        >
          {hasError ? "❌" : "📚"}
        </div>
      )}

      <div className="card-body" style={{ padding: "20px" }}>
        <h5 
          className="card-title" 
          style={{ 
            fontSize: "18px", 
            fontWeight: "600",
            marginBottom: "10px",
            color: "#212529",
            height: "48px",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: "2",
            WebkitBoxOrient: "vertical"
          }}
        >
          {item.title}
        </h5>
        
        {item.category && (
          <span 
            className="badge mb-2" 
            style={{ 
              background: "#eef2ff", 
              color: "#4361ee",
              fontWeight: "500",
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: "12px"
            }}
          >
            {item.category}
          </span>
        )}
        
        <div style={{ marginTop: "15px" }}>
          <p 
            className="card-text mb-1" 
            style={{ 
              fontSize: "12px", 
              color: "#6c757d",
              fontWeight: "500"
            }}
          >
            Price
          </p>
          <p 
            className="card-text" 
            style={{ 
              fontSize: "24px", 
              fontWeight: "700", 
              color: "#4361ee",
              marginBottom: "20px"
            }}
          >
            Rs. {item.price}
          </p>
        </div>
        
        <Link 
          to={`/item/${item._id}`} 
          className="btn btn-primary"
          style={{ 
            width: "100%",
            background: "linear-gradient(135deg, #4361ee, #7209b7)",
            border: "none",
            borderRadius: "8px",
            padding: "10px",
            fontWeight: "600",
            transition: "all 0.3s"
          }}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        >
          View Details
        </Link>
      </div>
      
      {/* Debug info (visible in development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          fontSize: "10px", 
          color: "#666", 
          padding: "8px",
          background: "#f8f9fa",
          borderTop: "1px solid #e0e0e0"
        }}>
          <div><strong>Debug Info:</strong></div>
          <div>ID: {item._id}</div>
          <div>Image field: {item.image || 'null'}</div>
          <div>ImageURL field: {item.imageURL || 'null'}</div>
          <div>Calculated URL: {imageUrl || 'null'}</div>
          <div>Status: {hasError ? '❌ Error' : imageSrc ? '✅ Loaded' : '⏳ Loading'}</div>
        </div>
      )}
    </div>
  );
};

export default ItemCard;