import React from "react";

function Hero() {
  return (
    <section className="text-center py-5 bg-light">
      <div className="container">
        <h1 className="fw-bold display-4 mb-3">Welcome to StudyReuse</h1>
        <p className="lead">
          Exchange or donate second-hand books, notes, and study materials.
        </p>
        <a href="/register" className="btn btn-primary mt-3">
          Get Started
        </a>
      </div>
    </section>
  );
}

export default Hero;
