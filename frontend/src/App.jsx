import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from './components/ErrorBoundary';

// Import all user pages
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
import EditItem from "./pages/EditItem";
import SearchResults from './pages/SearchResults';
import Items from "./pages/Items";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";

// Import Admin Components
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import ItemManagement from "./pages/admin/ItemManagement";
import OrderManagement from "./pages/admin/orderManagement";
import SendNotification from "./pages/admin/SendNotification";
import AdminSettings from "./pages/admin/AdminSettings";

// Import CartProvider
import { CartProvider } from "./context/CartContext";

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <AdminAuthProvider>
      <CartProvider>
        <BrowserRouter>
          {/* Only show Navbar & Footer for non-admin routes */}
          <Routes>
            {/* Admin routes don't show main Navbar/Footer */}
            <Route path="/admin/*" element={
              <Routes>
                <Route path="login" element={<AdminLogin />} />
                <Route path="register" element={<AdminRegister />} />
                <Route path="*" element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                } />
              </Routes>
            } />
            
            {/* All other routes show normal Navbar/Footer */}
            <Route path="*" element={
              <>
                <Navbar />
                <div className="min-h-[calc(100vh-140px)]">
                  <MainRoutes user={user} />
                </div>
                <Footer />
              </>
            } />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AdminAuthProvider>
  );
}

// Separate component for main routes (non-admin)
function MainRoutes({ user }) {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/item/:id" element={<ItemDetails />} />
      <Route path="/search" element={<SearchResults />} />
      
      {/* Login/Register */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
      />
      
      {/* User protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/add-item" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
      <Route path="/barter" element={<ProtectedRoute><BarterRequests /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/reviews/:itemId" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/my-items" element={<ProtectedRoute><MyItems /></ProtectedRoute>} />  
      <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
      <Route path="/edit-item/:id" element={<ProtectedRoute><EditItem /></ProtectedRoute>} />
      
      {/* Cart & Checkout Routes */}
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      
      {/* Chat route */}
      <Route 
        path="/chat/:itemId" 
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <ChatBox />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Routes inside AdminLayout */}
      <Route 
        path="/admin-layout-test" 
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="items" element={<ItemManagement />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="notifications" element={<SendNotification />} />
                <Route path="settings" element={<AdminSettings />} />
              </Routes>
            </AdminLayout>
          </AdminProtectedRoute>
        } 
      />
      
      {/* Catch all */}
      <Route 
        path="*" 
        element={<Navigate to={user ? "/dashboard" : "/"} replace />} 
      />
    </Routes>
  );
}

export default App;