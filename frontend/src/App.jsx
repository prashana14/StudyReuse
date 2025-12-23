import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// Import all pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddItem from "./pages/Additem";
import ItemDetails from "./pages/ItemDetails";
import ChatBox from "./pages/ChatBox";
import BarterRequests from "./pages/BarterRequests";
import Notifications from "./pages/Notifications";
import Reviews from "./pages/Reviews";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile"; // Add this import
import MyItems from "./pages/MyItems";
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      
      <div style={{ minHeight: "calc(100vh - 140px)" }}> {/* Add wrapper for content */}
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/item/:id" element={<ItemDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* User protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/add-item" element={
            <ProtectedRoute>
              <AddItem />
            </ProtectedRoute>
          } />
          
          <Route path="/chat/:itemId" element={
            <ProtectedRoute>
              <ChatBox />
            </ProtectedRoute>
          } />
          
          <Route path="/barter" element={
            <ProtectedRoute>
              <BarterRequests />
            </ProtectedRoute>
          } />
          
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          
          <Route path="/reviews/:itemId" element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          } />
          
          {/* Profile route - ADD THIS */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/my-items" element={
            <ProtectedRoute>
              <MyItems />
            </ProtectedRoute>
          }/>
          
          {/* Admin route */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
      
      <Footer />
    </BrowserRouter>
  );
}

export default App;