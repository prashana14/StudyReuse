import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";

const Home = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
  try {
    const res = await api.get("/items");
    
    // Direct access to the items array
    const itemsArray = res.data?.data?.items || [];
    
    console.log(`Found ${itemsArray.length} items`);
    
    // Now safely slice the array
    setItems(itemsArray.slice(0, 6));
    
  } catch (err) {
    console.error("Error fetching items:", err);
    setError("Failed to load items. Please try again.");
    setItems([]);
  } finally {
    setLoading(false);
  }
};

    fetchItems();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Exchange Knowledge, Save Resources</h1>
          <p>Join thousands of students sharing textbooks, notes, and study materials. Buy, sell, or barter educational resources with your peers.</p>
          <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" className="btn btn-primary" style={{ background: "white", color: "#667eea" }}>
              Get Started Free
            </Link>
            <Link to="/dashboard" className="btn btn-outline" style={{ borderColor: "white", color: "white" }}>
              Browse Items
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-title">
            <h2>Why Choose StudyReuse?</h2>
            <p>Our platform makes it easy to share educational resources and save money</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card card">
              <div className="feature-icon">💸</div>
              <h3>Save Money</h3>
              <p>Get study materials at fraction of the cost by buying from fellow students</p>
            </div>
            
            <div className="feature-card card">
              <div className="feature-icon">🔄</div>
              <h3>Easy Barter</h3>
              <p>Trade your old books for items you need without spending money</p>
            </div>
            
            <div className="feature-card card">
              <div className="feature-icon">🌱</div>
              <h3>Eco-Friendly</h3>
              <p>Reduce paper waste by reusing textbooks and notes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Items Section */}
      <section style={{ padding: "100px 0", background: "#f5f7ff" }}>
        <div className="container">
          <div className="section-title">
            <h2>Recent Study Items</h2>
            <p>Check out the latest study materials added by students</p>
          </div>

          {error && (
            <div className="card" style={{ background: "#ffebee", borderColor: "#ffcdd2" }}>
              <p style={{ color: "#d32f2f", margin: 0 }}>{error}</p>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div className="loading" style={{ margin: "0 auto" }}></div>
              <p style={{ marginTop: "20px", color: "var(--gray)" }}>Loading items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ fontSize: "18px", color: "var(--gray)" }}>No items available yet. Be the first to add one!</p>
              <Link to="/add-item" className="btn btn-primary mt-3">
                Add Your First Item
              </Link>
            </div>
          ) : (
            <div className="items-grid" style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
              gap: "30px" 
            }}>
              {items.map((item) => (
                <div key={item._id || item.id} className="card">
                  {item.imageURL ? (
                    <img
                      src={item.imageURL}
                      alt={item.title}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "16px"
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "200px",
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
                  
                  <h3 style={{ marginBottom: "8px" }}>{item.title || "Untitled Item"}</h3>
                  <p style={{ color: "var(--gray)", marginBottom: "12px" }}>
                    {item.description ? item.description.substring(0, 100) + "..." : "No description available"}
                  </p>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ 
                      fontSize: "20px", 
                      fontWeight: "700", 
                      color: "var(--primary)",
                      background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text"
                    }}>
                      Rs. {item.price || 0}
                    </span>
                    <Link to={`/item/${item._id || item.id}`} className="btn btn-outline">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {items.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
              <Link to="/dashboard" className="btn btn-primary">
                View All Items
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Home;