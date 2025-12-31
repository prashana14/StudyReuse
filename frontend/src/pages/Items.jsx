import { useEffect, useState } from "react";
import API from "../services/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ItemCard from "../components/ItemCard";

const Items = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [conditionFilter, setConditionFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Get search query from URL if present
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  // Check login status and fetch items
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    if (!token || !user) {
      navigate("/login");
      return;
    }
    
    fetchAllItems();
  }, [navigate]);

  // Fetch all items
  const fetchAllItems = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await API.get("/items");
      
      // Extract items from response
      let itemsArray = [];
      
      if (res.data?.data?.items && Array.isArray(res.data.data.items)) {
        itemsArray = res.data.data.items;
      } else if (Array.isArray(res.data)) {
        itemsArray = res.data;
      } else if (res.data?.items && Array.isArray(res.data.items)) {
        itemsArray = res.data.items;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        itemsArray = res.data.data;
      }
      
      setItems(itemsArray);
      setFilteredItems(itemsArray);
      
    } catch (err) {
      console.error("Error fetching all items:", err);
      setError("Could not load items. Please try again.");
      setItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
  
  // Get unique conditions
  const conditions = [...new Set(items.map(item => item.condition).filter(Boolean))];

  // Apply filters
  useEffect(() => {
    let result = [...items];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(item => 
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.category && item.category.toLowerCase().includes(term))
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter);
    }
    
    // Apply condition filter
    if (conditionFilter) {
      result = result.filter(item => item.condition === conditionFilter);
    }
    
    // Apply price range filter
    if (priceRange.min !== "") {
      const min = parseFloat(priceRange.min);
      if (!isNaN(min)) {
        result = result.filter(item => {
          const price = parseFloat(item.price) || 0;
          return price >= min;
        });
      }
    }
    
    if (priceRange.max !== "") {
      const max = parseFloat(priceRange.max);
      if (!isNaN(max)) {
        result = result.filter(item => {
          const price = parseFloat(item.price) || 0;
          return price <= max;
        });
      }
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        case "price-high":
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "oldest":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        default:
          return 0;
      }
    });
    
    setFilteredItems(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [items, searchTerm, categoryFilter, conditionFilter, priceRange, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  // Handle pagination
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setConditionFilter("");
    setPriceRange({ min: "", max: "" });
    setSortBy("newest");
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "40px auto", padding: "0 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-start", 
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "20px"
        }}>
          <div>
            <h1 style={{ 
              fontSize: "2.5rem", 
              marginBottom: "8px",
              background: "linear-gradient(135deg, #4361ee, #7209b7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: "700"
            }}>
              Browse All Items
            </h1>
            <p style={{ color: "#6c757d", fontSize: "1.125rem", maxWidth: "600px" }}>
              Discover study materials shared by students across campus
            </p>
          </div>
          <div style={{ display: "flex", gap: "15px", flexShrink: 0 }}>
            <Link 
              to="/add-item" 
              style={{ 
                padding: "12px 28px", 
                fontSize: "16px",
                background: "linear-gradient(135deg, #4361ee, #7209b7)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: "600",
                textDecoration: "none",
                transition: "all 0.3s",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <span style={{ fontSize: "20px" }}>+</span> Add New Item
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div style={{ 
        marginBottom: "30px", 
        padding: "25px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 20px rgba(0,0,0,0.08)"
      }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr auto", 
          gap: "20px",
          alignItems: "center",
          marginBottom: "25px"
        }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search by title, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px 14px 48px",
                border: "2px solid #e0e0e0",
                borderRadius: "10px",
                fontSize: "16px",
                transition: "all 0.3s",
                background: "#f8f9fa",
                outline: "none"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#4361ee";
                e.target.style.background = "white";
                e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e0e0e0";
                e.target.style.background = "#f8f9fa";
                e.target.style.boxShadow = "none";
              }}
            />
            <span style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "18px",
              color: "#4361ee"
            }}>
              🔍
            </span>
          </div>
          
          <button 
            onClick={resetFilters}
            style={{ 
              padding: "14px 24px", 
              fontSize: "14px",
              border: "2px solid #e0e0e0",
              background: "transparent",
              borderRadius: "10px",
              color: "#6c757d",
              fontWeight: "500",
              transition: "all 0.3s",
              whiteSpace: "nowrap",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#f8f9fa";
              e.target.style.color = "#4361ee";
              e.target.style.borderColor = "#4361ee";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
              e.target.style.color = "#6c757d";
              e.target.style.borderColor = "#e0e0e0";
            }}
          >
            <span>🔄</span> Reset All Filters
          </button>
        </div>

        {/* Advanced Filters */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
          gap: "20px" 
        }}>
          {/* Category Filter */}
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "14px", 
              fontWeight: "600", 
              color: "#495057" 
            }}>
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e0e0e0",
                borderRadius: "10px",
                fontSize: "14px",
                backgroundColor: "white",
                appearance: "none",
                backgroundImage: "url('data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%234361ee\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 16px center",
                backgroundSize: "16px",
                transition: "all 0.3s",
                cursor: "pointer",
                outline: "none"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#4361ee";
                e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e0e0e0";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "14px", 
              fontWeight: "600", 
              color: "#495057" 
            }}>
              Condition
            </label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e0e0e0",
                borderRadius: "10px",
                fontSize: "14px",
                backgroundColor: "white",
                appearance: "none",
                backgroundImage: "url('data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%234361ee\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 16px center",
                backgroundSize: "16px",
                transition: "all 0.3s",
                cursor: "pointer",
                outline: "none"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#4361ee";
                e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e0e0e0";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">All Conditions</option>
              {conditions.map(condition => (
                <option key={condition} value={condition}>
                  {condition.charAt(0).toUpperCase() + condition.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "14px", 
              fontWeight: "600", 
              color: "#495057" 
            }}>
              Price Range
            </label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  textAlign: "center",
                  outline: "none",
                  transition: "all 0.3s"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4361ee";
                  e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.boxShadow = "none";
                }}
                min="0"
              />
              <span style={{ 
                color: "#6c757d", 
                fontSize: "14px",
                fontWeight: "500",
                minWidth: "24px",
                textAlign: "center"
              }}>
              </span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  textAlign: "center",
                  outline: "none",
                  transition: "all 0.3s"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4361ee";
                  e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.boxShadow = "none";
                }}
                min="0"
              />
            </div>
          </div>

          {/* Sort By Filter */}
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "14px", 
              fontWeight: "600", 
              color: "#495057" 
            }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e0e0e0",
                borderRadius: "10px",
                fontSize: "14px",
                backgroundColor: "white",
                appearance: "none",
                backgroundImage: "url('data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%234361ee\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 16px center",
                backgroundSize: "16px",
                transition: "all 0.3s",
                cursor: "pointer",
                outline: "none"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#4361ee";
                e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e0e0e0";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="Sort By">Newest First</option>  
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "30px",
        padding: "0 10px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <p style={{ color: "#6c757d", fontSize: "16px" }}>
          Showing <strong style={{ color: "#4361ee" }}>{filteredItems.length}</strong> of <strong style={{ color: "#4361ee" }}>{items.length}</strong> items
          {searchTerm && (
            <span> for "<strong style={{ color: "#4361ee" }}>{searchTerm}</strong>"</span>
          )}
          {categoryFilter && (
            <span> in <strong style={{ color: "#4361ee" }}>{categoryFilter}</strong></span>
          )}
        </p>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ 
            fontSize: "14px", 
            color: "#6c757d",
            background: "#f8f9fa",
            padding: "6px 12px",
            borderRadius: "20px",
            fontWeight: "500"
          }}>
            Page {currentPage} of {totalPages || 1}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ 
          textAlign: "center", 
          padding: "80px 20px", 
          background: "white", 
          borderRadius: "12px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
          marginBottom: "40px"
        }}>
          <div style={{ 
            width: "60px", 
            height: "60px", 
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #4361ee",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 25px"
          }}></div>
          <h3 style={{ 
            marginBottom: "10px", 
            color: "#212529",
            fontSize: "20px"
          }}>
            Loading Items
          </h3>
          <p style={{ 
            color: "#6c757d", 
            fontSize: "16px",
            maxWidth: "400px",
            margin: "0 auto"
          }}>
            Fetching study materials from campus...
          </p>
        </div>
      ) : error ? (
        /* Error State */
        <div style={{ 
          textAlign: "center", 
          padding: "80px 20px", 
          background: "#fff5f5", 
          borderRadius: "12px",
          marginBottom: "40px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
          border: "1px solid #ffcccc"
        }}>
          <div style={{ 
            fontSize: "60px", 
            marginBottom: "20px", 
            color: "#e63946"
          }}>
            ⚠️
          </div>
          <h2 style={{ 
            marginBottom: "15px", 
            color: "#d32f2f",
            fontSize: "24px"
          }}>
            Error Loading Items
          </h2>
          <p style={{ 
            color: "#6c757d", 
            marginBottom: "30px", 
            maxWidth: "500px", 
            margin: "0 auto",
            fontSize: "16px",
            lineHeight: "1.5"
          }}>
            {error}
          </p>
          <button 
            onClick={fetchAllItems}
            style={{ 
              padding: "14px 32px", 
              fontSize: "16px",
              background: "linear-gradient(135deg, #4361ee, #7209b7)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontWeight: "600",
              transition: "all 0.3s",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(67, 97, 238, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span>🔄</span> Try Again
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div style={{ 
          textAlign: "center", 
          padding: "80px 20px", 
          background: "white", 
          borderRadius: "12px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
          marginBottom: "40px"
        }}>
          <div style={{ 
            fontSize: "80px", 
            marginBottom: "20px", 
            color: "#4361ee",
            opacity: 0.7
          }}>
            📭
          </div>
          <h3 style={{ 
            marginBottom: "16px", 
            color: "#212529",
            fontSize: "24px"
          }}>
            No Items Found
          </h3>
          <p style={{ 
            color: "#6c757d", 
            marginBottom: "30px", 
            maxWidth: "500px", 
            margin: "0 auto",
            fontSize: "16px",
            lineHeight: "1.6"
          }}>
            {searchTerm || categoryFilter || conditionFilter || priceRange.min || priceRange.max 
              ? "Try adjusting your filters to see more results."
              : "No items are currently available in the marketplace. Be the first to add one!"}
          </p>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              onClick={resetFilters}
              style={{ 
                padding: "14px 32px", 
                fontSize: "16px",
                background: "linear-gradient(135deg, #4361ee, #7209b7)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: "600",
                transition: "all 0.3s",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(67, 97, 238, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span>🔄</span> Reset Filters
            </button>
            <Link 
              to="/add-item"
              style={{ 
                padding: "14px 32px", 
                fontSize: "16px",
                background: "transparent",
                border: "2px solid #4361ee",
                borderRadius: "8px",
                color: "#4361ee",
                fontWeight: "600",
                transition: "all 0.3s",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.background = "rgba(67, 97, 238, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span>+</span> Add First Item
            </Link>
          </div>
        </div>
      ) : (
        /* Items Grid */
        <>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "30px",
            marginBottom: "50px"
          }}>
            {currentItems.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              gap: "10px",
              marginTop: "40px",
              flexWrap: "wrap"
            }}>
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "12px 24px",
                  background: currentPage === 1 ? "#f8f9fa" : "linear-gradient(135deg, #4361ee, #7209b7)",
                  color: currentPage === 1 ? "#adb5bd" : "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  fontWeight: "600",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.transform = "translateX(-3px)";
                    e.target.style.boxShadow = "0 5px 15px rgba(67, 97, 238, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.transform = "translateX(0)";
                    e.target.style.boxShadow = "none";
                  }
                }}
              >
                <span>←</span> Previous
              </button>
              
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      style={{
                        width: "44px",
                        height: "44px",
                        background: currentPage === pageNum ? "linear-gradient(135deg, #4361ee, #7209b7)" : "#f8f9fa",
                        color: currentPage === pageNum ? "white" : "#495057",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: currentPage === pageNum ? "700" : "600",
                        transition: "all 0.3s",
                        fontSize: "15px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== pageNum) {
                          e.target.style.background = "#eef2ff";
                          e.target.style.color = "#4361ee";
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 5px 15px rgba(67, 97, 238, 0.2)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== pageNum) {
                          e.target.style.background = "#f8f9fa";
                          e.target.style.color = "#495057";
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "none";
                        }
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "12px 24px",
                  background: currentPage === totalPages ? "#f8f9fa" : "linear-gradient(135deg, #4361ee, #7209b7)",
                  color: currentPage === totalPages ? "#adb5bd" : "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  fontWeight: "600",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.target.style.transform = "translateX(3px)";
                    e.target.style.boxShadow = "0 5px 15px rgba(67, 97, 238, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.target.style.transform = "translateX(0)";
                    e.target.style.boxShadow = "none";
                  }
                }}
              >
                Next <span>→</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Add CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 0 15px;
          }
          
          h1 {
            font-size: 2rem !important;
          }
          
          .filters-grid {
            grid-template-columns: 1fr !important;
          }
          
          .items-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)) !important;
            gap: 20px !important;
          }
        }
        
        @media (max-width: 480px) {
          h1 {
            font-size: 1.75rem !important;
          }
          
          .search-reset-row {
            grid-template-columns: 1fr !important;
          }
          
          .items-grid {
            grid-template-columns: 1fr !important;
          }
          
          .pagination {
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Items;