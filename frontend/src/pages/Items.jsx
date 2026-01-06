import { useEffect, useState } from "react";
import apiService from "../services/api";
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
  const [facultyFilter, setFacultyFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Faculty options
  const facultyOptions = [
    "BBA", "BITM", "BBS", "BBM", "BBA-F", "MBS", "MBA", "MITM", "MBA-F"
  ];

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
      
      const response = await apiService.items.getAll();
      console.log("Items API Response:", response);
      
      // Extract items from response
      let itemsArray = [];
      
      if (response.data?.data?.items && Array.isArray(response.data.data.items)) {
        itemsArray = response.data.data.items;
      } else if (Array.isArray(response.data)) {
        itemsArray = response.data;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        itemsArray = response.data.items;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        itemsArray = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        itemsArray = response.data;
      }
      
      console.log(`Found ${itemsArray.length} items`);
      
      // Log some sample items to check their condition values
      if (itemsArray.length > 0) {
        console.log("Sample items with conditions:");
        itemsArray.slice(0, 3).forEach((item, i) => {
          console.log(`Item ${i}:`, {
            title: item.title,
            condition: item.condition,
            conditionType: typeof item.condition
          });
        });
      }
      
      // Ensure Cloudinary URLs are available
      const itemsWithImageURL = itemsArray.map(item => ({
        ...item,
        imageURL: item.imageURL || item.image || null
      }));
      
      setItems(itemsWithImageURL);
      setFilteredItems(itemsWithImageURL);
      
    } catch (err) {
      console.error("❌ Error fetching all items:", err);
      setError(err.response?.data?.message || "Could not load items. Please try again.");
      setItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
  
  // Get condition options for filter dropdown
  const conditionOptions = (() => {
    // Try to extract conditions from items data
    const conditionsFromData = items
      .map(item => item.condition)
      .filter(condition => condition && typeof condition === 'string' && condition.trim() !== '')
      .map(condition => {
        const normalized = condition.trim().toLowerCase();
        
        // Standardize common variations
        const conditionMap = {
          'new': 'New',
          'like-new': 'Like New',
          'like new': 'Like New',
          'like_new': 'Like New',
          'good': 'Good',
          'fair': 'Fair',
          'poor': 'Poor',
          'excellent': 'Excellent',
          'very good': 'Very Good',
          'very_good': 'Very Good',
          'mint': 'Mint',
          'used': 'Used',
          'refurbished': 'Refurbished'
        };
        
        // First check exact match
        if (conditionMap[normalized]) {
          return conditionMap[normalized];
        }
        
        // Check if contains any of the keywords
        for (const [key, value] of Object.entries(conditionMap)) {
          if (normalized.includes(key)) {
            return value;
          }
        }
        
        // If no match, capitalize first letter
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
      });
    
    // Get unique values
    const uniqueConditions = [...new Set(conditionsFromData)];
    
    // If no conditions found in data, return defaults
    if (uniqueConditions.length === 0) {
      return ['New', 'Like New', 'Good', 'Fair', 'Poor'];
    }
    
    // Sort in logical order
    const sortOrder = ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Used', 'Refurbished'];
    
    return uniqueConditions.sort((a, b) => {
      const indexA = sortOrder.indexOf(a);
      const indexB = sortOrder.indexOf(b);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  })();

  // Apply filters
  useEffect(() => {
    let result = [...items];
    
    console.log("Applying filters...");
    console.log("Total items:", items.length);
    console.log("Condition filter:", conditionFilter);
    console.log("Faculty filter:", facultyFilter);
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(item => 
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.category && item.category.toLowerCase().includes(term)) ||
        (item.faculty && item.faculty.toLowerCase().includes(term))
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter);
    }
    
    // Apply faculty filter
    if (facultyFilter) {
      result = result.filter(item => {
        const itemFaculty = item.faculty?.toString().trim() || '';
        const filterFaculty = facultyFilter.trim();
        return itemFaculty.toLowerCase() === filterFaculty.toLowerCase();
      });
    }
    
    // Apply condition filter
    if (conditionFilter) {
      result = result.filter(item => {
        const itemCondition = item.condition?.toString().toLowerCase().trim() || '';
        const filterCondition = conditionFilter.toLowerCase().trim();
        
        // Handle variations - using exact matching logic
        const conditionMapping = {
          'new': ['new'],
          'like new': ['like new', 'like-new', 'like_new'],
          'good': ['good'],
          'fair': ['fair'],
          'poor': ['poor'],
          'excellent': ['excellent'],
          'very good': ['very good', 'very_good'],
          'mint': ['mint'],
          'used': ['used'],
          'refurbished': ['refurbished']
        };
        
        // Check if filter condition exists in mapping
        if (conditionMapping[filterCondition]) {
          const matches = conditionMapping[filterCondition].some(variation => 
            itemCondition === variation
          );
          return matches;
        }
        
        // Fallback: check if contains
        return itemCondition.includes(filterCondition);
      });
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
  }, [items, searchTerm, categoryFilter, facultyFilter, conditionFilter, sortBy]);

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
    setFacultyFilter("");
    setConditionFilter("");
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
              placeholder="Search by title, description, category, or faculty..."
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
            🔄 Reset All Filters
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

          {/* Faculty Filter */}
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "14px", 
              fontWeight: "600", 
              color: "#495057" 
            }}>
              Faculty
            </label>
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
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
              <option value="">All Faculties</option>
              {facultyOptions.map(faculty => (
                <option key={faculty} value={faculty}>{faculty}</option>
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
              {conditionOptions.map(condition => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
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
          {facultyFilter && (
            <span> from <strong style={{ color: "#4361ee" }}>{facultyFilter}</strong></span>
          )}
          {conditionFilter && (
            <span> with condition <strong style={{ color: "#4361ee" }}>{conditionFilter}</strong></span>
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
            ❌
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
            📚
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
            {searchTerm || categoryFilter || facultyFilter || conditionFilter
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
              🔄 Reset Filters
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
            grid-templateColumns: repeat(auto-fill, minmax(250px, 1fr)) !important;
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