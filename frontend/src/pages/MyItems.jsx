import { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";

const MyItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await API.get("/items/my");
        setItems(res.data || []);
      } catch (err) {
        console.error("Error fetching items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "40px auto" }}>
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
        <h2 style={{ margin: 0 }}>Your Listed Items ({items.length})</h2>
        <Link to="/add-item" className="btn btn-primary">
          + Add New Item
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px" }}>
          <div className="loading" style={{ margin: "0 auto", width: "40px", height: "40px", borderWidth: "3px" }}></div>
          <p style={{ marginTop: "20px", color: "#6c757d" }}>Loading your items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>📚</div>
          <h3 style={{ marginBottom: "16px", color: "#212529" }}>No items listed</h3>
          <p style={{ color: "#6c757d", marginBottom: "30px", maxWidth: "400px", margin: "0 auto" }}>
            You haven't added any items to the marketplace yet.
          </p>
          <Link to="/add-item" className="btn btn-primary" style={{ padding: "12px 32px" }}>
            Add Your First Item
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: "30px" }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "25px" 
          }}>
            {items.map((item) => (
              <div key={item._id} className="card hover-lift" style={{ padding: "20px" }}>
                {item.imageURL ? (
                  <img
                    src={item.imageURL}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "16px"
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
                
                <h3 style={{ marginBottom: "8px", fontSize: "18px" }}>{item.title}</h3>
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
                  {item.description?.substring(0, 100)}...
                </p>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ 
                    fontSize: "20px", 
                    fontWeight: "700", 
                    color: "#4361ee"
                  }}>
                    Rs. {item.price}
                  </span>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <Link 
                      to={`/item/${item._id}`} 
                      className="btn btn-outline"
                      style={{ padding: "8px 16px", fontSize: "14px" }}
                    >
                      View
                    </Link>
                    <button 
                      className="btn btn-outline"
                      style={{ 
                        padding: "8px 16px", 
                        fontSize: "14px",
                        borderColor: "#e63946",
                        color: "#e63946"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      {items.length > 0 && (
        <div className="card" style={{ marginTop: "30px", padding: "30px" }}>
          <h3 style={{ marginBottom: "20px" }}>Items Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>📚</div>
              <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px" }}>Total Items</p>
              <p style={{ fontSize: "24px", fontWeight: "700", color: "#4361ee" }}>{items.length}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>💰</div>
              <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px" }}>Total Value</p>
              <p style={{ fontSize: "24px", fontWeight: "700", color: "#38b000" }}>
                Rs. {items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toLocaleString()}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>👁️</div>
              <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px" }}>Avg. Price</p>
              <p style={{ fontSize: "24px", fontWeight: "700", color: "#7209b7" }}>
                Rs. {items.length > 0 ? Math.round(items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) / items.length) : 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyItems;