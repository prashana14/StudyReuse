import React from "react";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>StudyReuse</h3>
            <p>Exchange or donate second-hand books, notes, and study materials with fellow students.</p>
            <div style={{ marginTop: "20px", display: "flex", gap: "15px" }}>
              <a href="#" style={{ color: "white", fontSize: "20px" }}>📘</a>
              <a href="#" style={{ color: "white", fontSize: "20px" }}>🐦</a>
              <a href="#" style={{ color: "white", fontSize: "20px" }}>📸</a>
              <a href="#" style={{ color: "white", fontSize: "20px" }}>💼</a>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li style={{ marginBottom: "10px" }}><a href="/" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Home</a></li>
              <li style={{ marginBottom: "10px" }}><a href="/dashboard" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Dashboard</a></li>
              <li style={{ marginBottom: "10px" }}><a href="/add-item" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Add Item</a></li>
              <li style={{ marginBottom: "10px" }}><a href="/barter" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Barter</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact</h3>
            <p>📧 contact@studyreuse.com</p>
            <p>📞 +1 (123) 456-7890</p>
            <p>🏢 123 Campus Drive, University City</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} StudyReuse. All rights reserved. | Made with ❤️ for students</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;