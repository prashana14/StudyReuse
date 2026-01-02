import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import ItemCard from "../components/ItemCard";

// Available categories
const CATEGORIES = [
  'Textbooks',
  'Notes',
  'Lab Equipment',
  'Electronics',
  'Stationery',
  'Software',
  'Other'
];

// Available conditions
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

// Sort options
const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
  { value: 'title:asc', label: 'Title: A to Z' },
  { value: 'title:desc', label: 'Title: Z to A' }
];

// Price ranges
const PRICE_RANGES = [
  { min: 0, max: 100, label: 'Under ₹100' },
  { min: 100, max: 500, label: '₹100 - ₹500' },
  { min: 500, max: 1000, label: '₹500 - ₹1,000' },
  { min: 1000, max: 5000, label: '₹1,000 - ₹5,000' },
  { min: 5000, max: 10000, label: '₹5,000 - ₹10,000' },
  { min: 10000, max: null, label: 'Over ₹10,000' }
];

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const conditionParam = searchParams.get("condition") || "";
  const sortByParam = searchParams.get("sortBy") || "createdAt";
  const sortOrderParam = searchParams.get("sortOrder") || "desc";
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    category: categoryParam,
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    condition: conditionParam,
    sortBy: sortByParam,
    sortOrder: sortOrderParam
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const itemsPerPage = 12;

  // Fetch search results
  const fetchSearchResults = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = {
        q: query,
        page,
        limit: itemsPerPage,
        ...filters
      };
      
      // Clean up empty values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      console.log('Search params:', params);
      
      // Use API service search method
      const response = await API.items.search(query, params);
      
      // Handle different response formats
      let itemsArray = [];
      let total = 0;
      
      if (response.data?.data?.items && Array.isArray(response.data.data.items)) {
        itemsArray = response.data.data.items;
        total = response.data.data.total || response.data.data.items.length;
      } else if (Array.isArray(response.data)) {
        itemsArray = response.data;
        total = response.data.length;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        itemsArray = response.data.items;
        total = response.data.total || response.data.items.length;
      } else {
        itemsArray = [];
        total = 0;
      }
      
      setItems(itemsArray);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
      setCurrentPage(page);
      
      // Update URL with current filters
      updateURLWithFilters();
      
    } catch (err) {
      console.error("Error searching:", err);
      setError(err.response?.data?.message || "Failed to load search results");
      setItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [query, filters, navigate]);

  // Update URL with current filters
  const updateURLWithFilters = useCallback(() => {
    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.condition) params.set('condition', filters.condition);
    if (filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') {
      params.set('sortBy', filters.sortBy);
      params.set('sortOrder', filters.sortOrder);
    }
    
    navigate(`/search?${params.toString()}`, { replace: true });
  }, [query, filters, navigate]);

  // Initial fetch
  useEffect(() => {
    fetchSearchResults(1);
  }, [fetchSearchResults]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Reset to page 1 when filters change
    setCurrentPage(1);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    fetchSearchResults(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters = {
      category: "",
      minPrice: "",
      maxPrice: "",
      condition: "",
      sortBy: "createdAt",
      sortOrder: "desc"
    };
    
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    setCurrentPage(1);
    
    // Update URL
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    navigate(`/search?${params.toString()}`, { replace: true });
  };

  // Handle price range selection
  const handlePriceRangeSelect = (min, max) => {
    setFilters(prev => ({
      ...prev,
      minPrice: min,
      maxPrice: max
    }));
  };

  // Handle sort change
  const handleSortChange = (value) => {
    const [sortBy, sortOrder] = value.split(':');
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder
    }));
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      fetchSearchResults(page);
    }
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== "" && value !== null && value !== undefined && 
      !(value === "createdAt" && filters.sortOrder === "desc")
    ).length;
  };

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div style={{ 
        maxWidth: "1200px", 
        margin: "40px auto", 
        padding: "0 20px",
        textAlign: "center" 
      }}>
        <div style={{
          width: "50px",
          height: "50px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #4361ee",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "40px auto 20px"
        }}></div>
        <p style={{ color: "#6c757d" }}>Searching for "{query}"...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h1 style={{ 
              fontSize: "2rem", 
              marginBottom: "8px",
              color: "#212529"
            }}>
              Search Results {query && `for "${query}"`}
            </h1>
            
            {totalItems > 0 && (
              <p style={{ color: "#6c757d", fontSize: "1rem" }}>
                Found {totalItems} item{totalItems !== 1 ? 's' : ''}
                {query && ` matching "${query}"`}
              </p>
            )}
          </div>
          
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: "10px 16px",
              background: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            <span>🔍</span>
            Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </button>
        </div>
        
        {/* Search Stats */}
        {query && (
          <div style={{
            background: "#f8fafc",
            padding: "15px 20px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: "500", color: "#64748b" }}>Searching for:</span>
              <span style={{
                background: "#4361ee",
                color: "white",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                {query}
              </span>
              
              {appliedFilters.category && (
                <span style={{
                  background: "#eef2ff",
                  color: "#4361ee",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <span>📁</span>
                  {appliedFilters.category}
                </span>
              )}
              
              {(appliedFilters.minPrice || appliedFilters.maxPrice) && (
                <span style={{
                  background: "#f0f9ff",
                  color: "#0c4a6e",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <span>💰</span>
                  ₹{appliedFilters.minPrice || 0} - ₹{appliedFilters.maxPrice || "∞"}
                </span>
              )}
              
              {appliedFilters.condition && (
                <span style={{
                  background: "#fef7cd",
                  color: "#854d0e",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <span>⭐</span>
                  {appliedFilters.condition}
                </span>
              )}
              
              {(appliedFilters.sortBy !== 'createdAt' || appliedFilters.sortOrder !== 'desc') && (
                <span style={{
                  background: "#f3e8ff",
                  color: "#6b21a8",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <span>↕️</span>
                  {SORT_OPTIONS.find(opt => opt.value === `${appliedFilters.sortBy}:${appliedFilters.sortOrder}`)?.label || 'Sorted'}
                </span>
              )}
              
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={handleClearFilters}
                  style={{
                    background: "transparent",
                    border: "1px solid #dc2626",
                    color: "#dc2626",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginLeft: "auto"
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", gap: "30px", position: "relative" }}>
        {/* Filters Sidebar - Desktop */}
        <div style={{
          width: "280px",
          flexShrink: 0,
          display: showFilters ? "block" : "none",
          position: "sticky",
          top: "20px",
          alignSelf: "flex-start",
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
          paddingRight: "10px",
          '@media (max-width: 768px)': {
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            width: "100%",
            background: "white",
            zIndex: 1000,
            padding: "20px",
            display: showFilters ? "block" : "none"
          }
        }}>
          {/* Mobile filter header */}
          <div style={{
            display: "none",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "15px",
            borderBottom: "1px solid #e5e7eb",
            '@media (max-width: 768px)': {
              display: "flex"
            }
          }}>
            <h3 style={{ margin: "0", fontSize: "1.25rem" }}>Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#6b7280"
              }}
            >
              ×
            </button>
          </div>
          
          {/* Sort Options */}
          <div style={{ marginBottom: "30px" }}>
            <h4 style={{ marginBottom: "12px", fontSize: "16px", color: "#374151" }}>Sort By</h4>
            <select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                background: "white"
              }}
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Category Filter */}
          <div style={{ marginBottom: "30px" }}>
            <h4 style={{ marginBottom: "12px", fontSize: "16px", color: "#374151" }}>Category</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => handleFilterChange('category', '')}
                style={{
                  padding: "8px 12px",
                  background: !filters.category ? "#4361ee" : "white",
                  color: !filters.category ? "white" : "#374151",
                  border: `1px solid ${!filters.category ? "#4361ee" : "#d1d5db"}`,
                  borderRadius: "6px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s"
                }}
              >
                All Categories
              </button>
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => handleFilterChange('category', category)}
                  style={{
                    padding: "8px 12px",
                    background: filters.category === category ? "#4361ee" : "white",
                    color: filters.category === category ? "white" : "#374151",
                    border: `1px solid ${filters.category === category ? "#4361ee" : "#d1d5db"}`,
                    borderRadius: "6px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <span>📁</span>
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {/* Price Filter */}
          <div style={{ marginBottom: "30px" }}>
            <h4 style={{ marginBottom: "12px", fontSize: "16px", color: "#374151" }}>Price Range</h4>
            
            {/* Quick Price Ranges */}
            <div style={{ marginBottom: "15px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {PRICE_RANGES.map((range, index) => (
                <button
                  key={index}
                  onClick={() => handlePriceRangeSelect(range.min, range.max)}
                  style={{
                    padding: "8px 12px",
                    background: filters.minPrice == range.min && filters.maxPrice == range.max ? "#10b981" : "white",
                    color: filters.minPrice == range.min && filters.maxPrice == range.max ? "white" : "#374151",
                    border: `1px solid ${filters.minPrice == range.min && filters.maxPrice == range.max ? "#10b981" : "#d1d5db"}`,
                    borderRadius: "6px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
            
            {/* Custom Price Range */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                  Min Price
                </label>
                <input
                  type="number"
                  placeholder="₹ Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                  Max Price
                </label>
                <input
                  type="number"
                  placeholder="₹ Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Condition Filter */}
          <div style={{ marginBottom: "30px" }}>
            <h4 style={{ marginBottom: "12px", fontSize: "16px", color: "#374151" }}>Condition</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => handleFilterChange('condition', '')}
                style={{
                  padding: "8px 12px",
                  background: !filters.condition ? "#4361ee" : "white",
                  color: !filters.condition ? "white" : "#374151",
                  border: `1px solid ${!filters.condition ? "#4361ee" : "#d1d5db"}`,
                  borderRadius: "6px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                All Conditions
              </button>
              {CONDITIONS.map(condition => (
                <button
                  key={condition}
                  onClick={() => handleFilterChange('condition', condition)}
                  style={{
                    padding: "8px 12px",
                    background: filters.condition === condition ? "#f59e0b" : "white",
                    color: filters.condition === condition ? "white" : "#374151",
                    border: `1px solid ${filters.condition === condition ? "#f59e0b" : "#d1d5db"}`,
                    borderRadius: "6px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <span>⭐</span>
                  {condition}
                </button>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              onClick={handleApplyFilters}
              style={{
                flex: 1,
                padding: "12px",
                background: "#4361ee",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              style={{
                flex: 1,
                padding: "12px",
                background: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div style={{ flex: 1 }}>
          {/* Results Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
            paddingBottom: "15px",
            borderBottom: "1px solid #e5e7eb"
          }}>
            <div>
              <h3 style={{ margin: "0", fontSize: "1.25rem", color: "#374151" }}>
                Results
                {totalItems > 0 && (
                  <span style={{
                    marginLeft: "10px",
                    background: "#e5e7eb",
                    color: "#6b7280",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "14px"
                  }}>
                    {totalItems} item{totalItems !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>
            </div>
            
            {/* Sort By - Mobile */}
            <select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                background: "white",
                display: "none",
                '@media (max-width: 768px)': {
                  display: "block"
                }
              }}
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Error State */}
          {error && (
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              marginBottom: "30px"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
              <h4 style={{ marginBottom: "8px", color: "#991b1b" }}>Search Error</h4>
              <p style={{ color: "#dc2626", marginBottom: "20px" }}>{error}</p>
              <button
                onClick={() => fetchSearchResults(1)}
                style={{
                  padding: "10px 20px",
                  background: "#dc2626",
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
          
          {/* No Results State */}
          {!loading && !error && items.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              marginBottom: "30px"
            }}>
              <div style={{ fontSize: "64px", marginBottom: "20px", opacity: "0.5" }}>🔍</div>
              <h3 style={{ marginBottom: "12px", color: "#212529" }}>
                {query ? `No results found for "${query}"` : 'No items found'}
              </h3>
              <p style={{ color: "#6c757d", marginBottom: "30px", maxWidth: "400px", margin: "0 auto" }}>
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                <button
                  onClick={handleClearFilters}
                  style={{
                    padding: "12px 24px",
                    background: "#4361ee",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600"
                  }}
                >
                  Clear Filters
                </button>
                <Link
                  to="/add-item"
                  style={{
                    padding: "12px 24px",
                    background: "white",
                    color: "#4361ee",
                    border: "2px solid #4361ee",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: "600"
                  }}
                >
                  List an Item
                </Link>
              </div>
            </div>
          )}
          
          {/* Results Grid */}
          {items.length > 0 && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "25px",
                marginBottom: "40px"
              }}>
                {items.map(item => (
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
                  padding: "20px 0",
                  borderTop: "1px solid #e5e7eb"
                }}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: "8px 16px",
                      background: currentPage === 1 ? "#f3f4f6" : "#4361ee",
                      color: currentPage === 1 ? "#9ca3af" : "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      fontSize: "14px"
                    }}
                  >
                    ← Previous
                  </button>
                  
                  <div style={{ display: "flex", gap: "4px" }}>
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
                          onClick={() => handlePageChange(pageNum)}
                          style={{
                            padding: "8px 12px",
                            background: currentPage === pageNum ? "#4361ee" : "white",
                            color: currentPage === pageNum ? "white" : "#374151",
                            border: `1px solid ${currentPage === pageNum ? "#4361ee" : "#d1d5db"}`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            minWidth: "40px"
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span style={{ padding: "8px", color: "#6b7280" }}>...</span>
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          style={{
                            padding: "8px 12px",
                            background: currentPage === totalPages ? "#4361ee" : "white",
                            color: currentPage === totalPages ? "white" : "#374151",
                            border: `1px solid ${currentPage === totalPages ? "#4361ee" : "#d1d5db"}`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            minWidth: "40px"
                          }}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "8px 16px",
                      background: currentPage === totalPages ? "#f3f4f6" : "#4361ee",
                      color: currentPage === totalPages ? "#9ca3af" : "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      fontSize: "14px"
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Backdrop for mobile filters */}
      {showFilters && (
        <div
          onClick={() => setShowFilters(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
            display: "none",
            '@media (max-width: 768px)': {
              display: "block"
            }
          }}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="@media (max-width: 768px)"] {
            display: flex !important;
          }
          select[style*="@media (max-width: 768px)"] {
            display: block !important;
          }
          div[style*="position: fixed"][style*="@media (max-width: 768px)"] {
            display: block !important;
          }
        }
        
        /* Hide scrollbar for filter sidebar */
        div[style*="overflow-y: auto"]::-webkit-scrollbar {
          width: 6px;
        }
        
        div[style*="overflow-y: auto"]::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default SearchResults;