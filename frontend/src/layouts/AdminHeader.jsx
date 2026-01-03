// src/pages/admin/layout/AdminHeader.jsx
import { useEffect, useState } from 'react';
import AdminNotificationBell from '../components/admin/AdminNotificationBell';

const AdminHeader = ({ title }) => {
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('adminData') || '{}');
    setAdminData(data);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Title */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
            <p className="text-sm text-gray-600">Welcome back, {adminData?.name || 'Admin'}</p>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-6">
            {/* Notification Bell */}
            <AdminNotificationBell />

            {/* Separator */}
            <div className="h-8 w-px bg-gray-200"></div>

            {/* Admin Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="font-medium text-gray-800">{adminData?.name || 'Admin'}</p>
                <p className="text-sm text-gray-600">{adminData?.email || 'admin@ria.edu.np'}</p>
              </div>
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                  {getInitials(adminData?.name)}
                </div>
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;