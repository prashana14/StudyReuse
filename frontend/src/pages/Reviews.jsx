import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

const Reviews = () => {
  const { itemId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [itemDetails, setItemDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ""
  });

  const fetchReviews = async () => {
    try {
      const res = await API.get(`/reviews/item/${itemId}`);
      setReviews(res.data || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  const fetchItemDetails = async () => {
    try {
      const res = await API.get(`/items/${itemId}`);
      setItemDetails(res.data);
    } catch (err) {
      console.error("Error fetching item details:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchReviews(), fetchItemDetails()]);
      setLoading(false);
    };
    
    fetchData();
  }, [itemId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.comment.trim()) {
      alert("Please write a review comment");
      return;
    }

    setSubmitting(true);
    try {
      await API.post("/reviews", {
        itemId,
        rating: formData.rating,
        comment: formData.comment
      });
      
      // Reset form
      setFormData({
        rating: 5,
        comment: ""
      });
      
      // Refresh reviews
      await fetchReviews();
      
      alert("✅ Review submitted successfully!");
      
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
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
              borderTopColor: "#4361ee"
            }}></div>
            <p style={{ marginTop: "20px", color: "#6c757d", fontSize: "16px" }}>Loading reviews...</p>
          </div>
        </div>
      </div>
    );
  }

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
                borderRadius: "12px"
              }}
            />
          ) : (
            <div style={{
              width: "120px",
              height: "120px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "48px"
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
          <div className="card" style={{ padding: "30px", marginBottom: "30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "48px", fontWeight: "700", color: "#212529", lineHeight: 1 }}>
                  {calculateAverageRating()}
                </div>
                <div style={{ margin: "10px 0" }}>
                  {renderStars(parseFloat(calculateAverageRating()), "24px")}
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
          <div className="card" style={{ padding: "30px", marginBottom: "40px" }}>
            <h2 style={{ marginBottom: "25px", fontSize: "24px" }}>Write a Review</h2>
            
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
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4361ee"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  required
                />
                <p style={{ marginTop: "8px", fontSize: "14px", color: "#6c757d" }}>
                  Minimum 50 characters recommended
                </p>
              </div>
              
              <button
                type="submit"
                disabled={submitting || !formData.comment.trim()}
                className="btn btn-primary"
                style={{
                  padding: "16px 32px",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  opacity: submitting || !formData.comment.trim() ? 0.5 : 1
                }}
              >
                {submitting ? (
                  <>
                    <div className="loading" style={{ width: "20px", height: "20px", borderWidth: "2px" }}></div>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h2 style={{ margin: 0, fontSize: "24px" }}>All Reviews ({reviews.length})</h2>
              <select 
                style={{
                  padding: "10px 16px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "white",
                  cursor: "pointer"
                }}
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
            
            {reviews.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.3 }}>📝</div>
                <h3 style={{ marginBottom: "12px", color: "#212529" }}>No reviews yet</h3>
                <p style={{ color: "#6c757d", marginBottom: "0" }}>
                  Be the first to review this item
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                {reviews.map((review) => (
                  <div key={review._id} className="card hover-lift" style={{ padding: "30px" }}>
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
                          fontWeight: "bold"
                        }}>
                          {review.reviewer?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <h4 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>
                            {review.reviewer?.name || "Anonymous"}
                          </h4>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {renderStars(review.rating)}
                            <span style={{ fontSize: "14px", color: "#6c757d" }}>
                              {new Date(review.createdAt).toLocaleDateString()}
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
                            {new Date(review.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: "#6c757d" }}>{review.reply}</p>
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
          <div className="card" style={{ padding: "25px", marginBottom: "30px" }}>
            <h3 style={{ marginBottom: "20px", fontSize: "18px" }}>Item Summary</h3>
            
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Item Name</p>
              <p style={{ fontSize: "18px", fontWeight: "600", color: "#212529" }}>{itemDetails?.title}</p>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Price</p>
              <p style={{ fontSize: "24px", fontWeight: "700", color: "#4361ee" }}>
                Rs. {itemDetails?.price}
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
            
            <button 
              onClick={() => window.history.back()}
              className="btn btn-outline"
              style={{ width: "100%", padding: "12px", marginTop: "10px" }}
            >
              ← Back to Item
            </button>
          </div>

          {/* Review Guidelines */}
          <div className="card" style={{ padding: "25px" }}>
            <h3 style={{ marginBottom: "20px", fontSize: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>📝</span> Review Guidelines
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
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
                  flexShrink: 0
                }}>
                  1
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "#6c757d" }}>
                  Be honest about your experience
                </p>
              </div>
              
              <div style={{ display: "flex", gap: "12px" }}>
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
                  flexShrink: 0
                }}>
                  2
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "#6c757d" }}>
                  Focus on the item condition and accuracy
                </p>
              </div>
              
              <div style={{ display: "flex", gap: "12px" }}>
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
                  flexShrink: 0
                }}>
                  3
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "#6c757d" }}>
                  Mention any issues or highlights
                </p>
              </div>
              
              <div style={{ display: "flex", gap: "12px" }}>
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
                  flexShrink: 0
                }}>
                  4
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "#6c757d" }}>
                  Keep it respectful and constructive
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;