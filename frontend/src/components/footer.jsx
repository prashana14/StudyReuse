import React from "react";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <img 
              src="/logo.png" 
              alt="StudyReuse Logo"
              style={{ 
                height: "50px",
                borderRadius: "8px"
              }}
            />
            <h3>StudyReuse</h3>
            <p>Exchange,Buy and Sell second-hand books, notes, and study materials with fellow students.</p>
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
            <p>📧 studyreuse@gmail.com</p>
            <p>📞 01-4151615</p>
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