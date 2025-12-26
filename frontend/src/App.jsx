import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react"; // Add this
import { AuthContext } from "./context/AuthContext"; // Add this
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
import Profile from "./pages/Profile";
import MyItems from "./pages/MyItems";
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ItemManagement from './pages/admin/ItemManagement';
import SendNotification from './pages/admin/SendNotification';

function App() {
  const { user, loading } = useContext(AuthContext); // Get auth state

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar />
      
      <div style={{ minHeight: "calc(100vh - 140px)" }}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/item/:id" element={<ItemDetails />} />
          
          {/* Login/Register - redirect to dashboard if already logged in */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
          />
          
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
          
          {/* Admin Routes - protect these too */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="items" element={<ItemManagement />} />
            <Route path="notifications" element={<SendNotification />} />
          </Route>
          
          {/* Catch all - redirect based on auth status */}
          <Route 
            path="*" 
            element={<Navigate to={user ? "/dashboard" : "/"} replace />} 
          />
        </Routes>
      </div>
      
      <Footer />
    </BrowserRouter>
  );
}

export default App;