import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import your pages
import Home from './pages/home';
import Items from './pages/items';
import AddItem from './pages/additem';
import Login from './pages/login';
import Register from './pages/register';

// Import common components
import Navbar from './components/navbar';
import Footer from './components/footer';

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/items" element={<Items />} />
        <Route path="/add-item" element={<AddItem />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Optional: a fallback 404 page */}
        <Route path="*" element={<h1>Page Not Found</h1>} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
