import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import NotificationBell from '../components/admin/NotificationBell';

const AdminLayout = () => {
  const { admin, logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

 const menuItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' }, // Changed from '/admin'
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/items', label: 'Items', icon: '📦' },
  { path: '/admin/orders', label: 'Orders', icon: '📋' },
  { path: '/admin/notifications', label: 'Send Notifications', icon: '🔔' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-5 border-b border-blue-700 flex justify-between items-center">
          <h2 className={`font-bold ${sidebarOpen ? 'text-lg' : 'text-xs'}`}>
            {sidebarOpen ? 'StudyReuse Admin' : 'SR'}
          </h2>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-blue-700 transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <div className="p-5 border-b border-blue-700 flex items-center">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center font-bold text-white">
            {admin?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <h4 className="font-semibold truncate">{admin?.name || 'Admin'}</h4>
              <p className="text-sm text-blue-200 truncate">{admin?.email}</p>
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-500 rounded-full text-white">
                Admin
              </span>
            </div>
          )}
        </div>

        <nav className="p-3 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center p-3 rounded-lg mb-1 transition-colors ${location.pathname === item.path ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
            </Link>
          ))}
          
          <button 
            onClick={handleLogout}
            className="flex items-center p-3 rounded-lg mb-1 w-full text-left hover:bg-blue-700 mt-6 transition-colors"
          >
            <span className="text-xl">🚪</span>
            {sidebarOpen && (
              <span className="ml-3 font-medium">Logout</span>
            )}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b p-5 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Admin Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="text-gray-600">
              Welcome, <strong className="text-blue-600">{admin?.name}</strong>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>

        <footer className="bg-white border-t p-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} StudyReuse Admin Panel. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default AdminLayout;