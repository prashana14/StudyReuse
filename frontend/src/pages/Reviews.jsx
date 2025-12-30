import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

const Reviews = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [itemDetails, setItemDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ""
  });

  const fetchReviews = async () => {
    try {
      console.log("Fetching reviews for item:", itemId);
      const res = await API.get(`/reviews/item/${itemId}`); // ✅ No /api/ prefix
      console.log("Reviews response:", res.data);
      setReviews(res.data?.reviews || []);
    } catch (err) {
      console.error("Error fetching reviews:", err.response?.data || err.message);
    }
  };

  const fetchItemDetails = async () => {
  try {
    console.log("Fetching item details for:", itemId);
    
    // ✅ CORRECT: No /api/ prefix
    const res = await API.get(`/items/${itemId}`);
    console.log("Item details full response:", res);
    console.log("Item details data:", res.data);
    
    // Check the response structure
    if (res.data && res.data.data) {
      // If your API returns { success: true, data: {...} }
      setItemDetails(res.data.data);
    } else if (res.data) {
      // If your API returns the item directly
      setItemDetails(res.data);
    } else {
      console.error("Unexpected response structure:", res.data);
    }
  } catch (err) {
    console.error("Error fetching item details:", err.response?.data || err.message);
    console.error("Full error:", err);
  }
};

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchReviews(), fetchItemDetails()]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [itemId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.comment.trim()) {
      alert("Please write a review comment");
      return;
    }

    if (formData.comment.trim().length < 10) {
      alert("Please write a more detailed review (minimum 10 characters)");
      return;
    }

    setSubmitting(true);
    try {
      console.log("Submitting review with data:", {
        itemId,
        rating: formData.rating,
        comment: formData.comment
      });
      
      const response = await API.post("/reviews", {
        itemId,
        rating: formData.rating,
        comment: formData.comment
      });
      
      console.log("Review submission response:", response.data);
      
      // Reset form
      setFormData({
        rating: 5,
        comment: ""
      });
      
      // Refresh reviews
      await fetchReviews();
      
      alert("✅ Review submitted successfully!");
      
    } catch (err) {
      console.error("Error submitting review:", err.response?.data || err.message);
      
      const errorMessage = err.response?.data?.message || "Failed to submit review. Please try again.";
      
      if (err.response?.data?.error) {
        alert(`Error: ${errorMessage}\nDetails: ${JSON.stringify(err.response.data.error)}`);
      } else {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const getSortedReviews = () => {
    const sorted = [...reviews];
    
    switch (sortBy) {
      case "highest":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return sorted.sort((a, b) => a.rating - b.rating);
      case "newest":
      default:
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  const renderStars = (rating, size = "20px") => {
    return (
      <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: size,
              color: star <= rating ? "#ffc107" : "#e0e0e0"
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderStarDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    reviews.forEach(review => {
      const roundedRating = Math.round(review.rating);
      if (roundedRating >= 1 && roundedRating <= 5) {
        distribution[roundedRating]++;
      }
    });

    return [5, 4, 3, 2, 1].map((stars) => {
      const count = distribution[stars];
      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
      
      return (
        <div key={stars} style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ width: "60px", textAlign: "right" }}>
            <span style={{ fontSize: "14px", color: "#6c757d" }}>{stars} stars</span>
          </div>
          <div style={{ flex: 1, height: "8px", background: "#e0e0e0", borderRadius: "4px" }}>
            <div 
              style={{ 
                width: `${percentage}%`, 
                height: "100%", 
                background: "linear-gradient(90deg, #ffc107, #ff9800)",
                borderRadius: "4px"
              }}
            />
          </div>
          <div style={{ width: "40px", textAlign: "right" }}>
            <span style={{ fontSize: "14px", color: "#6c757d" }}>{count}</span>
          </div>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: "1200px", margin: "40px auto" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <div className="loading" style={{ 
              margin: "0 auto", 
              width: "60px", 
              height: "60px", 
              borderWidth: "4px",
              borderTopColor: "#4361ee",
              animation: "spin 1s linear infinite"
            }}></div>
            <p style={{ marginTop: "20px", color: "#6c757d", fontSize: "16px" }}>Loading reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!itemDetails) {
    return (
      <div className="container" style={{ maxWidth: "1200px", margin: "40px auto" }}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.3 }}>❌</div>
          <h2 style={{ marginBottom: "12px", color: "#212529" }}>Item Not Found</h2>
          <p style={{ color: "#6c757d", marginBottom: "30px" }}>
            The item you're looking for doesn't exist or has been removed.
          </p>
          <button 
            onClick={() => navigate("/")}
            className="btn btn-primary"
            style={{ padding: "12px 24px" }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const sortedReviews = getSortedReviews();
  const averageRating = calculateAverageRating();

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "40px auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "30px", marginBottom: "20px" }}>
          {itemDetails?.imageURL ? (
            <img
              src={itemDetails.imageURL}
              alt={itemDetails.title}
              style={{
                width: "120px",
                height: "120px",
                objectFit: "cover",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
            />
          ) : (
            <div style={{
              width: "120px",
              height: "120px",
              background: "linear-gradient(135deg, #4361ee, #7209b7)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "48px",
              boxShadow: "0 4px 12px rgba(67, 97, 238, 0.3)"
            }}>
              📚
            </div>
          )}
          
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              fontSize: "2.5rem", 
              marginBottom: "8px",
              background: "linear-gradient(135deg, #4361ee, #7209b7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Reviews & Ratings
            </h1>
            <p style={{ color: "#6c757d", fontSize: "1.125rem" }}>
              {itemDetails?.title || "Item"} • Share your experience with this item
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "40px" }}>
        {/* Main Content - Reviews */}
        <div>
          {/* Rating Summary */}
          <div className="card" style={{ 
            padding: "30px", 
            marginBottom: "30px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            borderRadius: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ 
                  fontSize: "48px", 
                  fontWeight: "700", 
                  color: "#212529", 
                  lineHeight: 1,
                  marginBottom: "5px"
                }}>
                  {averageRating}
                </div>
                <div style={{ margin: "10px 0" }}>
                  {renderStars(parseFloat(averageRating), "24px")}
                </div>
                <p style={{ color: "#6c757d", fontSize: "14px" }}>
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {renderStarDistribution()}
                </div>
              </div>
            </div>
          </div>

          {/* Add Review Form */}
          <div className="card" style={{ 
            padding: "30px", 
            marginBottom: "40px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            borderRadius: "16px"
          }}>
            <h2 style={{ marginBottom: "25px", fontSize: "24px", color: "#212529" }}>Write a Review</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "12px", fontWeight: "500", color: "#212529" }}>
                  Your Rating
                </label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "32px",
                        cursor: "pointer",
                        padding: "5px",
                        color: star <= formData.rating ? "#ffc107" : "#e0e0e0",
                        transition: "all 0.3s",
                        outline: "none"
                      }}
                      onMouseEnter={(e) => {
                        if (star > formData.rating) {
                          e.target.style.color = "#ffc107";
                          e.target.style.transform = "scale(1.1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (star > formData.rating) {
                          e.target.style.color = "#e0e0e0";
                          e.target.style.transform = "scale(1)";
                        }
                      }}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{ marginLeft: "15px", fontSize: "18px", fontWeight: "600", color: "#212529" }}>
                    {formData.rating}.0
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: "30px" }}>
                <label style={{ display: "block", marginBottom: "12px", fontWeight: "500", color: "#212529" }}>
                  Your Review
                </label>
                <textarea
                  placeholder="Share your experience with this item. What did you like or dislike? How was the condition?"
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  rows="5"
                  style={{
                    width: "100%",
                    padding: "16px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    resize: "vertical",
                    transition: "all 0.3s",
                    outline: "none",
                    fontFamily: "inherit"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4361ee"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  required
                  minLength="10"
                />
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginTop: "8px" 
                }}>
                  <p style={{ fontSize: "14px", color: "#6c757d", margin: 0 }}>
                    Minimum 10 characters required ({formData.comment.length}/10)
                  </p>
                  <span style={{ 
                    fontSize: "12px", 
                    color: formData.comment.length >= 10 ? "#28a745" : "#dc3545",
                    fontWeight: "500"
                  }}>
                    {formData.comment.length}/10
                  </span>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={submitting || !formData.comment.trim() || formData.comment.length < 10}
                className="btn btn-primary"
                style={{
                  padding: "16px 32px",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  opacity: (submitting || !formData.comment.trim() || formData.comment.length < 10) ? 0.5 : 1,
                  cursor: (submitting || !formData.comment.trim() || formData.comment.length < 10) ? "not-allowed" : "pointer",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  color: "white",
                  fontWeight: "600",
                  transition: "all 0.3s"
                }}
                onMouseEnter={(e) => {
                  if (!submitting && formData.comment.trim() && formData.comment.length >= 10) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 8px 25px rgba(67, 97, 238, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting && formData.comment.trim() && formData.comment.length >= 10) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }
                }}
              >
                {submitting ? (
                  <>
                    <div className="loading" style={{ 
                      width: "20px", 
                      height: "20px", 
                      borderWidth: "2px",
                      borderTopColor: "white",
                      borderRightColor: "transparent",
                      borderBottomColor: "transparent",
                      borderLeftColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }}></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span>📝</span> Submit Review
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "30px" 
            }}>
              <h2 style={{ margin: 0, fontSize: "24px", color: "#212529" }}>
                All Reviews ({reviews.length})
              </h2>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "10px 16px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "white",
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#4361ee"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
            
            {sortedReviews.length === 0 ? (
              <div className="card" style={{ 
                textAlign: "center", 
                padding: "60px 20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                borderRadius: "16px"
              }}>
                <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.3 }}>📝</div>
                <h3 style={{ marginBottom: "12px", color: "#212529" }}>No reviews yet</h3>
                <p style={{ color: "#6c757d", marginBottom: "30px" }}>
                  Be the first to review this item
                </p>
                <button
                  onClick={() => document.querySelector('textarea')?.focus()}
                  className="btn btn-primary"
                  style={{ padding: "12px 24px" }}
                >
                  Write First Review
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                {sortedReviews.map((review) => (
                  <div key={review._id} className="card" style={{ 
                    padding: "30px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    borderRadius: "16px",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                  }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <div style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #4361ee, #7209b7)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "20px",
                          fontWeight: "bold",
                          boxShadow: "0 4px 12px rgba(67, 97, 238, 0.3)"
                        }}>
                          {review.reviewer?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <h4 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#212529" }}>
                            {review.reviewer?.name || "Anonymous"}
                          </h4>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {renderStars(review.rating)}
                            <span style={{ fontSize: "14px", color: "#6c757d" }}>
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p style={{ 
                      fontSize: "16px", 
                      lineHeight: 1.6, 
                      color: "#212529",
                      margin: 0,
                      whiteSpace: "pre-wrap"
                    }}>
                      {review.comment}
                    </p>
                    
                    {review.reply && (
                      <div style={{ 
                        marginTop: "20px", 
                        padding: "20px", 
                        background: "#f8f9fa",
                        borderRadius: "12px",
                        borderLeft: "4px solid #4361ee"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                          <span style={{ fontWeight: "600", color: "#4361ee" }}>Owner's Response:</span>
                          <span style={{ fontSize: "14px", color: "#6c757d" }}>
                            {new Date(review.updatedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: "#6c757d", lineHeight: 1.6 }}>{review.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Item Summary Card */}
          <div className="card" style={{ 
            padding: "25px", 
            marginBottom: "30px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            borderRadius: "16px"
          }}>
            <h3 style={{ marginBottom: "20px", fontSize: "18px", color: "#212529" }}>Item Summary</h3>
            
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Item Name</p>
              <p style={{ fontSize: "18px", fontWeight: "600", color: "#212529" }}>{itemDetails?.title}</p>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Price</p>
              <p style={{ fontSize: "24px", fontWeight: "700", color: "#4361ee" }}>
                Rs. {itemDetails?.price?.toLocaleString() || "0"}
              </p>
            </div>
            
            {itemDetails?.category && (
              <div style={{ marginBottom: "25px" }}>
                <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Category</p>
                <span style={{
                  display: "inline-block",
                  background: "#eef2ff",
                  color: "#4361ee",
                  padding: "6px 16px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  {itemDetails.category}
                </span>
              </div>
            )}
            
            {itemDetails?.owner && (
              <div style={{ marginBottom: "25px" }}>
                <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Seller</p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4361ee, #7209b7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "bold"
                  }}>
                    {itemDetails.owner?.name?.charAt(0)?.toUpperCase() || "S"}
                  </div>
                  <span style={{ fontSize: "16px", fontWeight: "500", color: "#212529" }}>
                    {itemDetails.owner?.name || "Seller"}
                  </span>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              style={{ 
                width: "100%", 
                padding: "12px",
                border: "1px solid #4361ee",
                color: "#4361ee",
                background: "transparent",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "16px",
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
              ← Back to Item
            </button>
          </div>

          {/* Review Guidelines */}
          <div className="card" style={{ 
            padding: "25px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            borderRadius: "16px"
          }}>
            <h3 style={{ 
              marginBottom: "20px", 
              fontSize: "18px", 
              display: "flex", 
              alignItems: "center", 
              gap: "10px",
              color: "#212529"
            }}>
              <span>📝</span> Review Guidelines
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {[
                "Be honest about your experience",
                "Focus on the item condition and accuracy",
                "Mention any issues or highlights",
                "Keep it respectful and constructive",
                "Share how the item helped your studies"
              ].map((guideline, index) => (
                <div key={index} style={{ display: "flex", gap: "12px" }}>
                  <div style={{ 
                    width: "24px", 
                    height: "24px", 
                    borderRadius: "50%", 
                    background: "#eef2ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    color: "#4361ee",
                    flexShrink: 0,
                    fontWeight: "bold"
                  }}>
                    {index + 1}
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", color: "#6c757d", lineHeight: 1.5 }}>
                    {guideline}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading {
          border-style: solid;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .card {
          background: white;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #4361ee, #7209b7);
          color: white;
          border: none;
        }
        
        .btn-outline {
          background: transparent;
          border: 1px solid #4361ee;
          color: #4361ee;
        }
        
        .btn-outline:hover {
          background: #4361ee;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default Reviews;