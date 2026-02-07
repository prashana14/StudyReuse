import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { useAdminAuth } from "./context/AdminAuthContext";
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
import SellerOrders from './pages/SellerOrders'; // NEW IMPORT

// Import Admin Components
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import UsersPage from "./pages/admin/UsersPage";
import ItemsPage from "./pages/admin/ItemsPage";
import OrdersPage from "./pages/admin/OrdersPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";

// Import Providers
import { CartProvider } from "./context/CartProvider";
import { NotificationProvider } from "./context/NotificationContext";

function App() {
  const { user, loading: userLoading } = useContext(AuthContext);
  const { admin, loading: adminLoading } = useAdminAuth?.() || {};

  const isLoading = userLoading || adminLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <CartProvider>
      <NotificationProvider>
        <Routes>
          {/* Admin Routes - No Navbar/Footer */}
          <Route 
            path="/admin/login" 
            element={admin ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />} 
          />
          <Route 
            path="/admin/register" 
            element={admin ? <Navigate to="/admin/dashboard" replace /> : <AdminRegister />} 
          />
          
          {/* Admin Protected Routes with Layout */}
          <Route 
            path="/admin" 
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            {/* These will render in AdminLayout's Outlet */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="items" element={<ItemsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
          </Route>
          
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
      </NotificationProvider>
    </CartProvider>
  );
}

// Separate component for main routes (non-admin)
function MainRoutes({ user }) {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/item/:id" element={<ItemDetails />} />
      
      {/* 🔥 CRITICAL FIX: Redirect /items/:id to /item/:id */}
      <Route path="/items/:id" element={<Navigate to="/item/:id" replace />} />
      
      <Route path="/search" element={<SearchResults />} />
      <Route path="/items" element={<Items />} />
      
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
      <Route path="/barter-requests" element={<ProtectedRoute><BarterRequests /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/reviews/:itemId" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/my-items" element={<ProtectedRoute><MyItems /></ProtectedRoute>} />  
      <Route path="/edit-item/:id" element={<ProtectedRoute><EditItem /></ProtectedRoute>} />
      
      {/* Cart & Checkout Routes */}
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      
      {/* NEW: Seller Orders Route - for sellers to accept/reject orders */}
      <Route path="/seller/orders" element={<ProtectedRoute><SellerOrders /></ProtectedRoute>} />
      
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
      
      {/* 🔥 ADDITIONAL ROUTE: For chat notifications without itemId */}
      <Route path="/chat" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
      
      {/* Catch all */}
      <Route 
        path="*" 
        element={<Navigate to={user ? "/dashboard" : "/"} replace />} 
      />
    </Routes>
  );
}

export default App;