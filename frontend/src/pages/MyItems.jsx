import { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";

const MyItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState({}); // Track which items are updating

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError("");
        
        console.log(" Fetching my items...");
        const res = await API.get("/items/my");
        console.log(" API Response:", res);
        console.log(" Response data:", res.data);
        
        // DEBUG: Log the complete structure
        console.log(" Full response structure:");
        console.log("  - res.data exists:", !!res.data);
        console.log("  - res.data.data exists:", !!res.data?.data);
        console.log("  - res.data.data.items exists:", !!res.data?.data?.items);
        console.log("  - res.data.data.items is array:", Array.isArray(res.data?.data?.items));
        
        if (res.data?.data?.items) {
          console.log(` Found ${res.data.data.items.length} items in res.data.data.items`);
        }
        
        // EXTRACT ITEMS FROM RESPONSE - FIXED FOR YOUR CONTROLLER
        let itemsArray = [];
        
        if (!res.data) {
          console.warn(" No data in response");
        } 
        // Check your controller's format FIRST: { data: { items: [...] } }
        else if (res.data.data && res.data.data.items && Array.isArray(res.data.data.items)) {
          // Format from your controller: { data: { items: [...] } }
          console.log(" Got items from: res.data.data.items");
          itemsArray = res.data.data.items;
        }
        else if (Array.isArray(res.data)) {
          // Format 1: Direct array
          console.log(" Got direct array");
          itemsArray = res.data;
        }
        else if (res.data.items && Array.isArray(res.data.items)) {
          // Format 2: { items: [...] }
          console.log(" Got items from: res.data.items");
          itemsArray = res.data.items;
        }
        else if (res.data.data && Array.isArray(res.data.data)) {
          // Format 3: { data: [...] }
          console.log(" Got items from: res.data.data");
          itemsArray = res.data.data;
        }
        else if (typeof res.data === 'object') {
          // Format 4: Try to find any array in the object
          console.log(" Searching for array in object...");
          
          // Look for any array property
          const findArrayInObject = (obj) => {
            for (const key in obj) {
              if (Array.isArray(obj[key])) {
                console.log(` Found array in key: ${key}`);
                return obj[key];
              }
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                const nestedArray = findArrayInObject(obj[key]);
                if (nestedArray) return nestedArray;
              }
            }
            return [];
          };
          
          itemsArray = findArrayInObject(res.data);
          
          // If still empty, convert object values to array
          if (itemsArray.length === 0) {
            console.log(" Converting object values to array");
            itemsArray = Object.values(res.data).filter(item => 
              item && typeof item === 'object' && item._id
            );
          }
        }
        
        console.log(` Final items array length: ${itemsArray.length}`);
        
        if (itemsArray.length === 0) {
          console.log(" No items found or empty response");
        } else {
          console.log(" First item sample:", {
            id: itemsArray[0]._id,
            title: itemsArray[0].title,
            price: itemsArray[0].price
          });
        }
        
        setItems(itemsArray);
        
      } catch (err) {
        console.error("Error fetching items:", err);
        console.error("Error response:", err.response?.data);
        setError("Failed to load your items");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Function to update item status
  const updateStatus = async (itemId, newStatus) => {
    try {
      // Show loading for this specific item
      setUpdatingStatus(prev => ({ ...prev, [itemId]: true }));
      
      console.log(` Updating item ${itemId} status to: ${newStatus}`);
      
      const res = await API.patch(`/items/${itemId}/status`, { 
        status: newStatus 
      });
      
      // Update the item in local state
      setItems(prevItems => 
        prevItems.map(item => 
          item._id === itemId 
            ? { ...item, status: newStatus, ...res.data.data }
            : item
        )
      );
      
      console.log(`Status updated: ${newStatus}`);
      
    } catch (err) {
      console.error("Error updating status:", err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      // Remove loading for this item
      setUpdatingStatus(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Available': return '#10b981'; // Green
      case 'Sold': return '#ef4444'; // Red
      case 'Under Negotiation': return '#f59e0b'; // Amber
      case 'Unavailable': return '#6b7280'; // Gray
      default: return '#6b7280';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Available': return '';
      case 'Sold': return '';
      case 'Under Negotiation': return '';
      case 'Unavailable': return '';
      default: return '';
    }
  };

  // Render loading
  if (loading) {
    return (
      <div style={{ 
        maxWidth: "1200px", 
        margin: "40px auto", 
        textAlign: "center",
        padding: "60px 20px"
      }}>
        <div style={{
          width: "50px",
          height: "50px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #4361ee",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 20px"
        }}></div>
        <p style={{ marginTop: "20px", color: "#6c757d" }}>
          Loading your items...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Render error
  if (error) {
    return (
      <div style={{ 
        maxWidth: "800px", 
        margin: "60px auto",
        padding: "40px",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
        <h2>Error Loading Items</h2>
        <p style={{ color: "#6c757d", marginBottom: "30px" }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            background: "#4361ee",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Safely check if items is an array before mapping
  const itemsToRender = Array.isArray(items) ? items : [];

  // Main render
  return (
    <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ 
          fontSize: "2.5rem", 
          marginBottom: "16px",
          background: "linear-gradient(135deg, #4361ee, #7209b7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          My Items
        </h1>
        <p style={{ color: "#6c757d", fontSize: "1.125rem" }}>
          Manage all your study materials in one place
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ margin: 0 }}>
          Your Listed Items 
          <span style={{
            marginLeft: "10px",
            background: "#4361ee",
            color: "white",
            borderRadius: "50%",
            padding: "2px 10px",
            fontSize: "14px"
          }}>
            {itemsToRender.length}
          </span>
        </h2>
        <Link 
          to="/add-item" 
          style={{
            padding: "12px 24px",
            background: "linear-gradient(135deg, #4361ee, #7209b7)",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600",
            transition: "transform 0.2s",
            border: "none",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          + Add New Item
        </Link>
      </div>

      {itemsToRender.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>📚</div>
          <h3 style={{ marginBottom: "16px", color: "#212529" }}>No items listed</h3>
          <p style={{ color: "#6c757d", marginBottom: "30px", maxWidth: "400px", margin: "0 auto" }}>
            You haven't added any items to the marketplace yet.
          </p>
          <Link 
            to="/add-item" 
            style={{
              padding: "12px 32px",
              background: "linear-gradient(135deg, #4361ee, #7209b7)",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "600",
              display: "inline-block"
            }}
          >
            Add Your First Item
          </Link>
        </div>
      ) : (
        <>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "25px" 
          }}>
            {itemsToRender.map((item) => (
              <div 
                key={item._id} 
                style={{ 
                  background: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  position: "relative"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
              >
                {/* Status Badge */}
                <div style={{
                  position: "absolute",
                  top: "15px",
                  left: "15px",
                  background: getStatusColor(item.status || 'Available'),
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  zIndex: 10
                }}>
                  <span>{getStatusIcon(item.status || 'Available')}</span>
                  <span>{item.status || 'Available'}</span>
                </div>
                
                {/* Approval Badge */}
                {item.isApproved && (
                  <div style={{
                    position: "absolute",
                    top: "15px",
                    right: "15px",
                    background: "#10b981",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: "600"
                  }}>
                  Approved
                  </div>
                )}
                
                {/* Item Image */}
                {item.imageURL || item.image ? (
                  <img
                    src={item.imageURL || item.image}
                    alt={item.title || "Item"}
                    style={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "16px"
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.outerHTML = `
                        <div style="
                          width: 100%;
                          height: 180px;
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          border-radius: 8px;
                          margin-bottom: 16px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          color: white;
                          font-size: 48px;
                        ">
                          📚
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "180px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "48px"
                  }}>
                    📚
                  </div>
                )}
                
                <h3 style={{ marginBottom: "8px", fontSize: "18px", color: "#212529" }}>
                  {item.title || "Untitled Item"}
                </h3>
                
                {item.category && (
                  <span style={{
                    display: "inline-block",
                    background: "#eef2ff",
                    color: "#4361ee",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "500",
                    marginBottom: "12px"
                  }}>
                    {item.category}
                  </span>
                )}
                
                <p style={{ color: "#6c757d", marginBottom: "16px", fontSize: "14px" }}>
                  {item.description ? 
                    (item.description.length > 100 ? 
                      item.description.substring(0, 100) + "..." : 
                      item.description
                    ) : "No description available"
                  }
                </p>
                
                {/* Status Update Section */}
                <div style={{ 
                  marginBottom: "20px",
                  padding: "12px",
                  background: "#f8fafc",
                  borderRadius: "8px"
                }}>
                  <p style={{ 
                    fontSize: "13px", 
                    fontWeight: "600", 
                    color: "#64748b",
                    marginBottom: "8px" 
                  }}>
                    Update Status:
                  </p>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {['Available', 'Sold', 'Under Negotiation', 'Unavailable'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(item._id, status)}
                        disabled={updatingStatus[item._id] || (item.status === status)}
                        style={{
                          padding: "6px 12px",
                          background: item.status === status ? getStatusColor(status) : "white",
                          color: item.status === status ? "white" : getStatusColor(status),
                          border: `1px solid ${getStatusColor(status)}`,
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          cursor: updatingStatus[item._id] ? "not-allowed" : "pointer",
                          opacity: updatingStatus[item._id] ? 0.7 : 1,
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                        onMouseEnter={(e) => {
                          if (!updatingStatus[item._id] && item.status !== status) {
                            e.target.style.background = getStatusColor(status);
                            e.target.style.color = "white";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!updatingStatus[item._id] && item.status !== status) {
                            e.target.style.background = "white";
                            e.target.style.color = getStatusColor(status);
                          }
                        }}
                      >
                        {updatingStatus[item._id] && item.status === status ? (
                          <>
                            <div style={{
                              width: "10px",
                              height: "10px",
                              border: "2px solid white",
                              borderTop: "2px solid transparent",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite"
                            }}></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            {getStatusIcon(status)} {status}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ 
                    fontSize: "20px", 
                    fontWeight: "700", 
                    color: "#4361ee"
                  }}>
                    ₹{item.price || "0"}
                  </span>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <Link 
                      to={`/item/${item._id}`} 
                      style={{
                        padding: "8px 16px",
                        border: "1px solid #4361ee",
                        color: "#4361ee",
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        transition: "all 0.2s",
                        background: "transparent"
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
                      View
                    </Link>
                    <Link 
                      to={`/edit-item/${item._id}`} 
                      style={{
                        padding: "8px 16px",
                        background: "#4361ee",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        transition: "all 0.2s"
                      }}
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Summary */}
          {itemsToRender.length > 0 && (
            <div style={{ 
              marginTop: "30px", 
              padding: "30px",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ marginBottom: "20px", color: "#212529" }}>Items Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "10px", color: "#4361ee" }}>📚</div>
                  <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px" }}>Total Items</p>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: "#4361ee" }}>{itemsToRender.length}</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "10px", color: "#38b000" }}>💰</div>
                  <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px" }}>Total Value</p>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: "#38b000" }}>
                    ₹{itemsToRender.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "10px", color: "#7209b7" }}>👁️</div>
                  <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px" }}>Avg. Price</p>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: "#7209b7" }}>
                    ₹{itemsToRender.length > 0 ? 
                      Math.round(itemsToRender.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) / itemsToRender.length) : 
                      0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyItems;