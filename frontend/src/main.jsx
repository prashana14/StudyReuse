// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom"; // Add this
import App from "./App";
import "./styles.css";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { CartProvider } from "./context/CartProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router> {/* This is your only Router */}
      <AuthProvider>
        <AdminAuthProvider>
          <NotificationProvider>
            <CartProvider>
              <App /> {/* App.jsx should NOT have BrowserRouter */}
            </CartProvider>
          </NotificationProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);