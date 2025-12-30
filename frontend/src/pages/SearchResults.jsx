import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import API from "../services/api";
import ItemCard from "../components/ItemCard";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    condition: "",
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  useEffect(() => {
    fetchSearchResults();
  }, [query, filters]);

  const fetchSearchResults = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: query,
        ...filters
      }).toString();
      
      const res = await API.get(`/items/search?${params}`);
      setItems(res.data || []);
    } catch (err) {
      console.error("Error searching:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px" }}>
      <h1>Search Results for "{query}"</h1>
      
      {/* Filters Sidebar */}
      <div style={{ display: "flex", gap: "30px", marginTop: "30px" }}>
        <div style={{ width: "250px" }}>
          <h3>Filters</h3>
          {/* Add filter inputs here */}
        </div>
        
        {/* Results */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <p>Loading...</p>
          ) : items.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
              {items.map(item => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <p>No items found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;