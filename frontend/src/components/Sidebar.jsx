import { Link } from "react-router-dom";
import "./AdminNavbar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <h3>Menu</h3>
      <nav>
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/items">Items</Link>
        <Link to="/admin/reviews">Reviews</Link>
        <Link to="/admin/barters">Barters</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
