import React from "react";
import "./AdminNavbar.css";
const AdminTable = ({ columns, data }) => {
  return (
    <table className="admin-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={columns.length}>No data available</td></tr>
        ) : (
          data.map((row) => (
            <tr key={row._id}>
              {columns.map((col) => (
                <td key={col}>{row[col.toLowerCase()] || row[col]}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default AdminTable;
