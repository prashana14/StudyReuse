import { useEffect, useState } from "react";
import AdminNavbar from "../components/AdminNavbar";
import Sidebar from "../components/Sidebar";
import StatsCard from "../components/StatsCard";
import AdminTable from "../components/AdminTable";
import API from "../services/api";
import "../components/AdminNavbar.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    API.get("/admin/users").then(res => setUsers(res.data));
    API.get("/admin/items").then(res => setItems(res.data));
  }, []);

  return (
    <div className="admin-dashboard">
      <AdminNavbar />
      <div className="dashboard-container">
        <Sidebar />
        <main className="dashboard-main">
          <div className="stats-container">
            <StatsCard title="Users" value={users.length} />
            <StatsCard title="Items" value={items.length} />
          </div>

          <h3>Users List</h3>
          <AdminTable
            columns={["Name", "Email", "Role", "isBlocked"]}
            data={users}
          />

          <h3>Items List</h3>
          <AdminTable
            columns={["Title", "Price", "Owner"]}
            data={items.map(item => ({ ...item, owner: item.owner.name }))}
          />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
