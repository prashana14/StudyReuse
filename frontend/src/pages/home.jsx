import { useEffect, useState } from "react";
import apiService from "../services/api"; // CHANGED: Import apiService
import { Link } from "react-router-dom";

const Home = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!token && !!user);
    
    // Always fetch items (public endpoint)
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      
      // 🔥 CHANGED: Use apiService.items.getAll()
      const response = await apiService.items.getAll();
      console.log("Home API Response:", response.data);
      
      // Extract items from the new API response structure
      const itemsArray = response.data?.data?.items || 
                        response.data?.items || 
                        response.data || 
                        [];
      
      console.log(`Found ${itemsArray.length} items`);
      
      // 🔥 FIX: Handle Cloudinary URLs
      const itemsWithImageURL = itemsArray.map(item => ({
        ...item,
        // Ensure we have the Cloudinary URL
        imageURL: item.imageURL || item.image || null
      }));
      
      setItems(itemsWithImageURL.slice(0, 6));
      
    } catch (err) {
      console.error("❌ Error fetching items:", err);
      setError(err.response?.data?.message || "Failed to load items. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get item image URL
  const getItemImage = (item) => {
    return item.imageURL || item.image || null;
  };

  return (
    <div className="home-page">
      {/* Hero Section - Different content for logged in vs not logged in */}
      <section className="hero">
        <div className="hero-content">
          {isLoggedIn ? (
            <>
              <h1>Welcome Back to StudyReuse!</h1>
              <p>Continue your journey of sharing knowledge and saving resources. Discover new study materials or list your own.</p>
              <div className="hero-buttons">
                <Link to="/items" className="btn btn-primary">
                  Browse All Items
                </Link>
                <Link to="/add-item" className="btn btn-outline" style={{ borderColor: "white", color: "white" }}>
                  + List New Item
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1>Exchange Knowledge, Save Resources</h1>
              <p>Join thousands of students sharing textbooks, notes, and study materials. Buy, sell, or barter educational resources with your peers.</p>
              <div className="hero-buttons">
                <Link to="/register" className="btn btn-primary">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn btn-outline" style={{ borderColor: "white", color: "white" }}>
                  Already Have an Account
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features Section - Same for both */}
      <section className="features">
        <div className="container">
          <div className="section-title">
            <h2>Why Choose StudyReuse?</h2>
            <p>Our platform makes it easy to share educational resources and save money</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card card hover-lift">
              <div className="feature-icon">💸</div>
              <h3>Save Money</h3>
              <p>Get study materials at 50-70% off retail prices by buying from fellow students</p>
            </div>
            
            <div className="feature-card card hover-lift">
              <div className="feature-icon">🔄</div>
              <h3>Easy Barter</h3>
              <p>Trade your old books for items you need without spending extra money</p>
            </div>
            
            <div className="feature-card card hover-lift">
              <div className="feature-icon">🌱</div>
              <h3>Eco-Friendly</h3>
              <p>Reduce paper waste and carbon footprint by reusing textbooks and notes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Items Section - Show for ALL users (public) */}
      <section className="recent-items-section">
        <div className="container">
          <div className="section-title">
            <h2>Recent Study Items</h2>
            <p>Check out the latest study materials added by students</p>
          </div>

          {error && (
            <div className="card" style={{ 
              background: "#ffebee", 
              borderColor: "#ffcdd2", 
              textAlign: "center", 
              padding: "30px",
              borderRadius: "12px",
              marginBottom: "30px"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "15px", color: "#d32f2f" }}>⚠️</div>
              <p style={{ color: "#d32f2f", margin: 0, fontSize: "16px", fontWeight: "500" }}>{error}</p>
              <button 
                onClick={fetchItems}
                style={{
                  marginTop: "15px",
                  padding: "8px 20px",
                  background: "#d32f2f",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ 
              textAlign: "center", 
              padding: "60px",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
            }}>
              <div className="loading" style={{ 
                width: "50px", 
                height: "50px", 
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #4361ee",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px"
              }}></div>
              <p style={{ color: "#6c757d", fontSize: "16px" }}>Loading featured items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="card" style={{ 
              textAlign: "center", 
              padding: "50px 30px",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
            }}>
              <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>📚</div>
              <h3 style={{ marginBottom: "10px", color: "#212529", fontSize: "24px" }}>No items available yet</h3>
              <p style={{ color: "#6c757d", marginBottom: "30px", fontSize: "16px" }}>
                Be the first to add study materials to our community!
              </p>
              {isLoggedIn ? (
                <Link to="/add-item" className="btn btn-primary" style={{
                  padding: "12px 32px",
                  fontSize: "16px",
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block"
                }}>
                  Add Your First Item
                </Link>
              ) : (
                <Link to="/register" className="btn btn-primary" style={{
                  padding: "12px 32px",
                  fontSize: "16px",
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block"
                }}>
                  Join to Add Items
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="items-grid">
                {items.map((item) => {
                  const imageUrl = getItemImage(item);
                  return (
                    <div key={item._id} className="card hover-lift" style={{
                      background: "white",
                      borderRadius: "12px",
                      overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      transition: "transform 0.3s, box-shadow 0.3s"
                    }}>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.title}
                          style={{
                            width: "100%",
                            height: "200px",
                            objectFit: "cover",
                            borderRadius: "8px 8px 0 0"
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div style="
                                width: 100%;
                                height: 200px;
                                background: linear-gradient(135deg, #4361ee, #7209b7);
                                border-radius: 8px 8px 0 0;
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
                          height: "200px",
                          background: "linear-gradient(135deg, #4361ee, #7209b7)",
                          borderRadius: "8px 8px 0 0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "48px"
                        }}>
                          📚
                        </div>
                      )}
                      
                      <div style={{ padding: "20px" }}>
                        <h3 style={{ 
                          marginBottom: "8px", 
                          fontSize: "18px", 
                          fontWeight: "600",
                          color: "#212529"
                        }}>
                          {item.title || "Untitled Item"}
                        </h3>
                        <p style={{ 
                          color: "#6c757d", 
                          marginBottom: "12px", 
                          fontSize: "14px", 
                          lineHeight: "1.5",
                          minHeight: "42px"
                        }}>
                          {item.description ? 
                            (item.description.length > 100 ? item.description.substring(0, 100) + "..." : item.description) 
                            : "No description available"}
                        </p>
                        
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center" 
                        }}>
                          <span style={{ 
                            fontSize: "20px", 
                            fontWeight: "700",
                            background: "linear-gradient(135deg, #4361ee, #7209b7)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text"
                          }}>
                            Rs. {item.price || 0}
                          </span>
                          <Link 
                            to={`/item/${item._id}`} 
                            className="btn btn-outline" 
                            style={{ 
                              padding: "8px 16px", 
                              fontSize: "14px",
                              border: "1px solid #4361ee",
                              color: "#4361ee",
                              borderRadius: "6px",
                              textDecoration: "none",
                              fontWeight: "500",
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
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div style={{ textAlign: "center", marginTop: "50px" }}>
                <Link to="/items" className="btn btn-primary" style={{
                  padding: "14px 32px",
                  fontSize: "16px",
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "transform 0.3s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  View All Items →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* For Non-Logged In Users: Show How It Works Section */}
      {!isLoggedIn && (
        <section className="how-it-works" style={{ 
          padding: "100px 0", 
          background: "#cae9eaff"
        }}>
          <div className="container">
            <div className="section-title">
              <h2 style={{ fontSize: "2.5rem", marginBottom: "16px", color: "#212529" }}>How It Works</h2>
              <p style={{ fontSize: "1.125rem", color: "#6c757d" }}>Join thousands of students in just 3 simple steps</p>
            </div>
            
            <div className="steps-grid">
              <div className="step-card" style={{
                textAlign: "center",
                padding: "40px 30px",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                transition: "transform 0.3s, box-shadow 0.3s"
              }}>
                <div className="step-number" style={{
                  width: "60px",
                  height: "60px",
                  margin: "0 auto 20px",
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "white"
                }}>
                  1
                </div>
                <h3 style={{ marginBottom: "15px", color: "#212529", fontSize: "20px" }}>Create Your Account</h3>
                <p style={{ color: "#6c757d", lineHeight: "1.6", fontSize: "15px" }}>
                  Sign up for free in 30 seconds. Free To Use.
                </p>
              </div>
              
              <div className="step-card" style={{
                textAlign: "center",
                padding: "40px 30px",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                transition: "transform 0.3s, box-shadow 0.3s"
              }}>
                <div className="step-number" style={{
                  width: "60px",
                  height: "60px",
                  margin: "0 auto 20px",
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "white"
                }}>
                  2
                </div>
                <h3 style={{ marginBottom: "15px", color: "#212529", fontSize: "20px" }}>Browse or List Items</h3>
                <p style={{ color: "#6c757d", lineHeight: "1.6", fontSize: "15px" }}>
                  Find study materials you need or list items you want to share.
                </p>
              </div>
              
              <div className="step-card" style={{
                textAlign: "center",
                padding: "40px 30px",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                transition: "transform 0.3s, box-shadow 0.3s"
              }}>
                <div className="step-number" style={{
                  width: "60px",
                  height: "60px",
                  margin: "0 auto 20px",
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "white"
                }}>
                  3
                </div>
                <h3 style={{ marginBottom: "15px", color: "#212529", fontSize: "20px" }}>Connect & Trade</h3>
                <p style={{ color: "#6c757d", lineHeight: "1.6", fontSize: "15px" }}>
                  Message sellers directly and arrange pickup or delivery.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* For Logged In Users: Show Quick Actions */}
      {isLoggedIn && (
        <section className="quick-actions" style={{ 
          padding: "100px 0", 
          background: "white"
        }}>
          <div className="container">
            <div className="section-title">
              <h2 style={{ fontSize: "2.5rem", marginBottom: "16px", color: "#212529" }}>Quick Actions</h2>
              <p style={{ fontSize: "1.125rem", color: "#6c757d" }}>What would you like to do today?</p>
            </div>
            
            <div className="actions-grid">
              <Link to="/add-item" className="action-card" style={{
                textAlign: "center",
                padding: "40px 30px",
                background: "#a4c1ddc5",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                transition: "transform 0.3s, box-shadow 0.3s",
                textDecoration: "none",
                color: "inherit",
                border: "1px solid #dee2e6"
              }}>
                <div className="action-icon" style={{ fontSize: "48px", marginBottom: "20px" }}>📝</div>
                <h3 style={{ marginBottom: "15px", color: "#212529", fontSize: "20px" }}>List New Item</h3>
                <p style={{ color: "#6c757d", lineHeight: "1.6", fontSize: "15px", marginBottom: 0 }}>
                  Share your study materials with the community
                </p>
              </Link>
              
              <Link to="/items" className="action-card" style={{
                textAlign: "center",
                padding: "40px 30px",
                background: "#a4c1ddc5",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                transition: "transform 0.3s, box-shadow 0.3s",
                textDecoration: "none",
                color: "inherit",
                border: "1px solid #dee2e6"
              }}>
                <div className="action-icon" style={{ fontSize: "48px", marginBottom: "20px" }}>🔍</div>
                <h3 style={{ marginBottom: "15px", color: "#212529", fontSize: "20px" }}>Browse Items</h3>
                <p style={{ color: "#6c757d", lineHeight: "1.6", fontSize: "15px", marginBottom: 0 }}>
                  Find study materials you need
                </p>
              </Link>
              
              <Link to="/dashboard" className="action-card" style={{
                textAlign: "center",
                padding: "40px 30px",
                background: "#a4c1ddc5",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                transition: "transform 0.3s, box-shadow 0.3s",
                textDecoration: "none",
                color: "inherit",
                border: "1px solid #dee2e6"
              }}>
                <div className="action-icon" style={{ fontSize: "48px", marginBottom: "20px" }}>📊</div>
                <h3 style={{ marginBottom: "15px", color: "#212529", fontSize: "20px" }}>Your Dashboard</h3>
                <p style={{ color: "#6c757d", lineHeight: "1.6", fontSize: "15px", marginBottom: 0 }}>
                  View your listings and messages
                </p>
              </Link>
              
              <Link to="/profile" className="action-card" style={{
                textAlign: "center",
                padding: "40px 30px",
                background: "#a4c1ddc5",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                transition: "transform 0.3s, box-shadow 0.3s",
                textDecoration: "none",
                color: "inherit",
                border: "1px solid #dee2e6"
              }}>
                <div className="action-icon" style={{ fontSize: "48px", marginBottom: "20px" }}>👤</div>
                <h3 style={{ marginBottom: "15px", color: "#212529", fontSize: "20px" }}>Update Profile</h3>
                <p style={{ color: "#6c757d", lineHeight: "1.6", fontSize: "15px", marginBottom: 0 }}>
                  Manage your account settings
                </p>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Different for logged in vs not logged in */}
      {isLoggedIn ? (
        <section className="logged-in-cta" style={{ 
          padding: "80px 0", 
          background: "linear-gradient(135deg, #38b000 0%, #2d9100 100%)",
          textAlign: "center"
        }}>
          <div className="container">
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <h2 style={{ fontSize: "2.5rem", marginBottom: "20px", color: "white" }}>
                Ready to Share More?
              </h2>
              <p style={{ 
                fontSize: "1.125rem", 
                color: "rgba(255, 255, 255, 0.9)", 
                marginBottom: "40px",
                lineHeight: "1.6"
              }}>
                Every item you list helps another student save money and supports sustainable education.
              </p>
              <div style={{ marginBottom: "25px" }}>
                <Link to="/add-item" className="btn btn-primary" style={{ 
                  padding: "18px 48px", 
                  fontSize: "18px", 
                  fontWeight: "600",
                  background: "white",
                  color: "#38b000",
                  textDecoration: "none",
                  borderRadius: "8px",
                  display: "inline-block"
                }}>
                  List Another Item
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="final-cta" style={{ 
          padding: "100px 0", 
          background: "linear-gradient(135deg, #ffd166 0%, #ff9e00 100%)",
          textAlign: "center"
        }}>
          <div className="container">
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <h2 style={{ fontSize: "2.5rem", marginBottom: "20px", color: "#212529" }}>
                Start Your Academic Journey Today
              </h2>
              <p style={{ 
                fontSize: "1.125rem", 
                color: "#495057", 
                marginBottom: "40px",
                lineHeight: "1.6"
              }}>
                Join our growing community of students who are transforming the way 
                educational resources are shared and accessed.
              </p>
              <div style={{ marginBottom: "25px" }}>
                <Link to="/register" className="btn btn-primary" style={{ 
                  padding: "18px 48px", 
                  fontSize: "18px", 
                  fontWeight: "600",
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "8px",
                  display: "inline-block"
                }}>
                  Join StudyReuse Free
                </Link>
              </div>
              <p style={{ fontSize: "14px", color: "rgba(0, 0, 0, 0.6)" }}>
                Free to Use • 30-second signup • Access immediately
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Add custom styles */}
      <style>{`
        .home-page {
          min-height: 100vh;
        }
        
        .hero {
          padding: 100px 0;
          background: linear-gradient(135deg, #4361ee, #7209b7);
          text-align: center;
          color: white;
        }
        
        .hero h1 {
          font-size: 3rem;
          margin-bottom: 20px;
          font-weight: 700;
        }
        
        .hero p {
          font-size: 1.25rem;
          max-width: 600px;
          margin: 0 auto 30px;
          opacity: 0.9;
          line-height: 1.6;
        }
        
        .hero-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .section-title {
          text-align: center;
          margin-bottom: 60px;
        }
        
        .section-title h2 {
          font-size: 2.5rem;
          margin-bottom: 16px;
          color: #212529;
        }
        
        .section-title p {
          font-size: 1.125rem;
          color: #6c757d;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .features {
          padding: 100px 0;
          background: #f8f9fa;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
        }
        
        .feature-card {
          padding: 40px 30px;
          text-align: center;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }
        
        .feature-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        
        .feature-card h3 {
          margin-bottom: 15px;
          color: #212529;
          font-size: 20px;
        }
        
        .feature-card p {
          color: #6c757d;
          line-height: 1.6;
          margin-bottom: 0;
        }
        
        .recent-items-section {
          padding: 100px 0;
          background: #f5f7ff;
        }
        
        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 30px;
        }
        
        .card.hover-lift {
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .card.hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }
        
        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #4361ee, #7209b7);
          color: white;
          border: none;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(67, 97, 238, 0.3);
        }
        
        .btn-outline {
          background: transparent;
          border: 1px solid;
        }
        
        .how-it-works .steps-grid,
        .quick-actions .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 40px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .action-card:hover,
        .step-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          border-color: #4361ee;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.2rem;
          }
          
          .hero p {
            font-size: 1.125rem;
          }
          
          .hero-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .hero-buttons .btn {
            width: 100%;
            max-width: 300px;
          }
          
          .items-grid,
          .features-grid,
          .steps-grid,
          .actions-grid {
            grid-template-columns: 1fr;
          }
          
          .section-title h2 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;