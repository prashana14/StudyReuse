import { useEffect, useState } from "react";
import api from "../services/api";
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
    
    if (token && user) {
      fetchItems();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get("/items");
      const itemsArray = res.data?.data?.items || [];
      console.log(`Found ${itemsArray.length} items`);
      setItems(itemsArray.slice(0, 6));
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to load items. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
    }
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

      {/* Recent Items Section - Only shown when logged in */}
      {isLoggedIn && (
        <section className="recent-items-section">
          <div className="container">
            <div className="section-title">
              <h2>Recent Study Items</h2>
              <p>Check out the latest study materials added by students</p>
            </div>

            {error && (
              <div className="card" style={{ background: "#ffebee", borderColor: "#ffcdd2", textAlign: "center", padding: "30px" }}>
                <div style={{ fontSize: "48px", marginBottom: "15px" }}>⚠️</div>
                <p style={{ color: "#d32f2f", margin: 0 }}>{error}</p>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px" }}>
                <div className="loading" style={{ 
                  width: "50px", 
                  height: "50px", 
                  border: "4px solid #f3f3f3",
                  borderTop: "4px solid var(--primary)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 20px"
                }}></div>
                <p style={{ color: "var(--gray)" }}>Loading items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "50px 30px" }}>
                <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>📚</div>
                <h3 style={{ marginBottom: "10px" }}>No items available yet</h3>
                <p style={{ color: "var(--gray)", marginBottom: "30px" }}>
                  Be the first to add study materials to our community!
                </p>
                <Link to="/add-item" className="btn btn-primary">
                  Add Your First Item
                </Link>
              </div>
            ) : (
              <>
                <div className="items-grid">
                  {items.map((item) => (
                    <div key={item._id || item.id} className="card hover-lift">
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
                          background: "linear-gradient(135deg, var(--primary), var(--secondary))",
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
                      <p style={{ color: "var(--gray)", marginBottom: "12px", fontSize: "14px", lineHeight: "1.5" }}>
                        {item.description ? item.description.substring(0, 100) + "..." : "No description available"}
                      </p>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="text-gradient" style={{ fontSize: "20px", fontWeight: "700" }}>
                          Rs. {item.price || 0}
                        </span>
                        <Link to={`/item/${item._id || item.id}`} className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "14px" }}>
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ textAlign: "center", marginTop: "50px" }}>
                  <Link to="/items" className="btn btn-primary">
                    View All Items →
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* For Non-Logged In Users: Show How It Works Section */}
      {!isLoggedIn && (
        <section className="how-it-works">
          <div className="container">
            <div className="section-title">
              <h2>How It Works</h2>
              <p>Join thousands of students in just 3 simple steps</p>
            </div>
            
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Create Your Account</h3>
                <p>Sign up for free in 30 seconds. Free To Use.</p>
              </div>
              
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Browse or List Items</h3>
                <p>Find study materials you need or list items you want to share.</p>
              </div>
              
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Connect & Trade</h3>
                <p>Message sellers directly and arrange pickup or delivery.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* For Logged In Users: Show Quick Actions */}
      {isLoggedIn && (
        <section className="quick-actions">
          <div className="container">
            <div className="section-title">
              <h2>Quick Actions</h2>
              <p>What would you like to do today?</p>
            </div>
            
            <div className="actions-grid">
              <Link to="/add-item" className="action-card">
                <div className="action-icon">📝</div>
                <h3>List New Item</h3>
                <p>Share your study materials with the community</p>
              </Link>
              
              <Link to="/items" className="action-card">
                <div className="action-icon">🔍</div>
                <h3>Browse Items</h3>
                <p>Find study materials you need</p>
              </Link>
              
              <Link to="/dashboard" className="action-card">
                <div className="action-icon">📊</div>
                <h3>Your Dashboard</h3>
                <p>View your listings and messages</p>
              </Link>
              
              <Link to="/profile" className="action-card">
                <div className="action-icon">👤</div>
                <h3>Update Profile</h3>
                <p>Manage your account settings</p>
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
                  color: "#38b000"
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
                  background: "var(--primary)",
                  color: "white"
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
      <style jsx>{`
        .home-page {
          min-height: 100vh;
        }
        
        .hero-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 30px;
        }
        
        .recent-items-section {
          padding: 100px 0;
          background: #f5f7ff;
        }
        
        /* How It Works Section */
        .how-it-works {
          padding: 100px 0;
          background: #f5f7ff;
        }
        
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 40px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .step-card {
          text-align: center;
          padding: 40px 30px;
          background: white;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          transition: var(--transition);
        }
        
        .step-card:hover {
          transform: translateY(-10px);
          box-shadow: var(--shadow-lg);
        }
        
        .step-number {
          width: 60px;
          height: 60px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: white;
        }
        
        .step-card h3 {
          margin-bottom: 15px;
          color: var(--dark);
        }
        
        .step-card p {
          color: var(--gray);
          line-height: 1.6;
        }
        
        /* Quick Actions Section */
        .quick-actions {
          padding: 100px 0;
          background: white;
        }
        
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
        }
        
        .action-card {
          text-align: center;
          padding: 40px 30px;
          background: white;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          transition: var(--transition);
          text-decoration: none;
          color: inherit;
          border: 1px solid var(--light-gray);
        }
        
        .action-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary);
        }
        
        .action-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        
        .action-card h3 {
          margin-bottom: 15px;
          color: var(--dark);
        }
        
        .action-card p {
          color: var(--gray);
          line-height: 1.6;
          margin-bottom: 0;
        }
        
        /* Testimonials Section */
        .testimonials {
          padding: 100px 0;
          background: #f8f9fa;
        }
        
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
        }
        
        .testimonial-card {
          background: white;
          border-radius: var(--radius);
          padding: 30px;
          box-shadow: var(--shadow);
        }
        
        .testimonial-content {
          margin-bottom: 25px;
          padding-bottom: 25px;
          border-bottom: 1px solid var(--light-gray);
        }
        
        .testimonial-content p {
          font-style: italic;
          color: var(--dark);
          line-height: 1.6;
          margin-bottom: 0;
        }
        
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .author-avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
        }
        
        .testimonial-author h4 {
          margin-bottom: 5px;
          color: var(--dark);
        }
        
        .testimonial-author p {
          color: var(--gray);
          font-size: 14px;
          margin-bottom: 0;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .hero-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .hero-buttons .btn {
            width: 100%;
            max-width: 300px;
          }
          
          .items-grid,
          .steps-grid,
          .actions-grid,
          .testimonials-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;