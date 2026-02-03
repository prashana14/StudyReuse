import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";

const Reviews = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [itemDetails, setItemDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ""
  });
  const [hasReviewed, setHasReviewed] = useState(false);

  // Fetch item details
  const fetchItemDetails = async () => {
    try {
      const response = await apiService.items.getById(itemId);
      if (response && response.data) {
        setItemDetails(response.data);
      }
    } catch (err) {
      console.error("Error fetching item details:", err);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      const response = await apiService.reviews.getItemReviews(itemId);
      
      if (response && response.success) {
        const reviewsData = response.reviews || [];
        setReviews(reviewsData);
        
        // Check if current user has reviewed
        if (user && reviewsData.length > 0) {
          const userHasReviewed = reviewsData.some(review => {
            if (!review.reviewer) return false;
            const reviewerId = review.reviewer._id || review.reviewer.id || review.reviewer;
            const userId = user.id || user._id;
            return reviewerId === userId;
          });
          setHasReviewed(userHasReviewed);
        }
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  // Load all data
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchItemDetails(), fetchReviews()]);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, [itemId, user]);

  // Handle review submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert("Please login to submit a review");
      navigate("/login");
      return;
    }

    // Validation
    if (!formData.comment.trim()) {
      alert("Please write a review comment");
      return;
    }

    if (formData.comment.trim().length < 10) {
      alert("Please write a more detailed review (minimum 10 characters)");
      return;
    }

    if (hasReviewed) {
      alert("You have already reviewed this item");
      return;
    }

    // Check if user owns the item
    if (itemDetails?.owner && (itemDetails.owner._id === user.id || itemDetails.owner === user.id)) {
      alert("You cannot review your own item");
      return;
    }

    setSubmitting(true);
    
    try {
      await apiService.reviews.create(itemId, formData.rating, formData.comment);
      
      // Reset form
      setFormData({
        rating: 5,
        comment: ""
      });
      
      // Update state
      setHasReviewed(true);
      
      // Show success message
      alert("Review submitted successfully!");
      
      // Refresh reviews
      setTimeout(() => {
        fetchReviews();
      }, 500);
      
    } catch (err) {
      console.error("Error submitting review:", err);
      
      let errorMsg = "Failed to submit review. Please try again.";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      alert(`Error: ${errorMsg}`);
      
      // If duplicate review error, update state
      if (err.response?.status === 400 && 
          err.response?.data?.message?.includes("already reviewed")) {
        setHasReviewed(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper functions
  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  };

  const renderStars = (rating, size = "20px") => {
    const numericRating = Number(rating) || 0;
    return (
      <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: size,
              color: star <= numericRating ? "#ffc107" : "#e0e0e0"
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="container" style={{ maxWidth: "1200px", margin: "40px auto" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ 
              margin: "0 auto", 
              width: "60px", 
              height: "60px", 
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #4361ee",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <p style={{ marginTop: "20px", color: "#6c757d", fontSize: "16px" }}>Loading reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if item exists
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
            style={{ 
              padding: "12px 24px",
              background: "#4361ee",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const averageRating = calculateAverageRating();
  const isOwner = user && itemDetails?.owner && (itemDetails.owner._id === user.id || itemDetails.owner === user.id);

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px" }}>
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
              📦
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
            
            {/* Status badges */}
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              {hasReviewed && (
                <span style={{ 
                  background: "#e8f5e9", 
                  color: "#155724",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  ✓ You've reviewed this item
                </span>
              )}
              {isOwner && (
                <span style={{ 
                  background: "#fff3cd", 
                  color: "#856404",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  👑 This is your item
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "40px" }}>
        {/* Main Content */}
        <div>
          {/* Rating Summary */}
          <div style={{ 
            background: "white",
            padding: "30px", 
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            marginBottom: "30px"
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
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter(r => Math.round(r.rating) === stars).length;
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
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Add Review Form */}
          {user && !isOwner && !hasReviewed ? (
            <div style={{ 
              background: "white",
              padding: "30px", 
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              marginBottom: "40px"
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
                          transition: "all 0.3s"
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
                      fontFamily: "inherit"
                    }}
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
                  disabled={submitting || formData.comment.length < 10}
                  style={{
                    padding: "16px 32px",
                    fontSize: "16px",
                    background: "linear-gradient(135deg, #4361ee, #7209b7)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "600",
                    cursor: formData.comment.length < 10 ? "not-allowed" : "pointer",
                    opacity: formData.comment.length < 10 ? 0.5 : 1,
                    transition: "all 0.3s"
                  }}
                >
                  {submitting ? (
                    <>
                      <span style={{ 
                        display: "inline-block",
                        width: "16px",
                        height: "16px",
                        border: "2px solid white",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        marginRight: "8px",
                        verticalAlign: "middle"
                      }}></span>
                      Submitting...
                    </>
                  ) : "Submit Review"}
                </button>
              </form>
            </div>
          ) : !user ? (
            <div style={{ 
              background: "white",
              padding: "30px", 
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              marginBottom: "40px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "20px", color: "#4361ee" }}>🔒</div>
              <h3 style={{ marginBottom: "10px", color: "#212529" }}>Login to Review</h3>
              <p style={{ color: "#6c757d", marginBottom: "20px" }}>
                You need to be logged in to submit a review for this item.
              </p>
              <button
                onClick={() => navigate("/login")}
                style={{ 
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600"
                }}
              >
                Login Now
              </button>
            </div>
          ) : hasReviewed ? (
            <div style={{ 
              background: "#e8f5e9",
              padding: "30px", 
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              marginBottom: "40px",
              textAlign: "center",
              border: "1px solid #c3e6cb"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "15px", color: "#28a745" }}>✓</div>
              <h3 style={{ marginBottom: "10px", color: "#155724" }}>Review Submitted</h3>
              <p style={{ color: "#6c757d" }}>
                Thank you for your review. You can only review each item once.
              </p>
            </div>
          ) : null}

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
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ 
                  padding: "8px 16px",
                  background: "#f8f9fa",
                  borderRadius: "20px",
                  fontSize: "14px",
                  color: "#6c757d"
                }}>
                  {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>
            
            {reviews.length === 0 ? (
              <div style={{ 
                background: "white",
                padding: "60px 20px", 
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.3 }}>⭐</div>
                <h3 style={{ marginBottom: "12px", color: "#212529" }}>No reviews yet</h3>
                <p style={{ color: "#6c757d", marginBottom: "30px" }}>
                  Be the first to review this item
                </p>
                {user && !isOwner && !hasReviewed && (
                  <button
                    onClick={() => document.querySelector('textarea')?.focus()}
                    style={{ 
                      padding: "12px 24px",
                      background: "linear-gradient(135deg, #4361ee, #7209b7)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "600"
                    }}
                  >
                    Write First Review
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                {reviews.map((review) => (
                  <div 
                    key={review._id || review.id}
                    style={{ 
                      background: "white",
                      padding: "30px",
                      borderRadius: "16px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      transition: "transform 0.3s ease",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                    }}
                  >
                    {/* Highlight user's own review */}
                    {user && review.reviewer && 
                     (review.reviewer._id === user.id || review.reviewer === user.id) && (
                      <div style={{
                        position: "absolute",
                        top: "15px",
                        right: "15px",
                        background: "#e8f5e9",
                        color: "#155724",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "500"
                      }}>
                        Your Review
                      </div>
                    )}
                    
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
                          {review.reviewer?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div>
                          <h4 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#212529" }}>
                            {review.reviewer?.name || "Anonymous"}
                          </h4>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {renderStars(review.rating)}
                            <span style={{ fontSize: "14px", color: "#6c757d" }}>
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : "Recent"}
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Item Summary Card */}
          <div style={{ 
            background: "white",
            padding: "25px", 
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            marginBottom: "30px"
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
          <div style={{ 
            background: "white",
            padding: "25px",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{ 
              marginBottom: "20px", 
              fontSize: "18px", 
              display: "flex", 
              alignItems: "center", 
              gap: "10px",
              color: "#212529"
            }}>
              📝 Review Guidelines
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 0 15px;
          }
          
          div[style*="grid-template-columns: 1fr 350px"] {
            grid-template-columns: 1fr !important;
          }
          
          div[style*="display: flex; align-items: center; gap: 30px;"] {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }
          
          div[style*="padding: 30px"] {
            padding: 20px;
          }
          
          h1 {
            font-size: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Reviews;