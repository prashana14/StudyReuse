// src/components/admin/AdminLayout.jsx
import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Get admin user from localStorage
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  // Navigation items - removed settings
  const navItems = [
    { title: 'Dashboard', path: '/admin/dashboard', icon: '📊', exact: true },
    { title: 'Analytics', path: '/admin/analytics', icon: '📈' },
    { title: 'Orders', path: '/admin/orders', icon: '📦' },
    { title: 'Users', path: '/admin/users', icon: '👥' },
    { title: 'Items', path: '/admin/items', icon: '📚' },
    { title: 'Notifications', path: '/admin/notifications', icon: '🔔' }
  ];

  const getPageTitle = () => {
    const currentPath = location.pathname;
    const currentItem = navItems.find(item => 
      item.exact ? currentPath === item.path : currentPath.startsWith(item.path)
    );
    return currentItem?.title || 'Dashboard';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb'
      }}>
        
        {/* Sidebar Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: '70px',
          padding: '0 20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              height: '40px',
              width: '40px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>SR</span>
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>StudyReuse</h1>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                textDecoration: 'none',
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#1d4ed8' : '#374151',
                borderLeft: isActive ? '4px solid #2563eb' : 'none'
              })}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ fontWeight: 500 }}>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', position: 'absolute', bottom: 0, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px' }}>
            <div style={{
              height: '40px',
              width: '40px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontWeight: 600 }}>
                {adminUser?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827'
              }}>
                {adminUser?.name || 'Admin User'}
              </p>
              <p style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                {adminUser?.email || 'admin@studyreuse.com'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        backgroundColor: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Header */}
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '70px',
            padding: '0 30px'
          }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827' }}>
                {getPageTitle()}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  style={{
                    height: '40px',
                    width: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f3f4f6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🔔</span>
                </button>

                {notificationsOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    width: '300px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    zIndex: 50
                  }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
                      <h3 style={{ fontWeight: 600, color: '#111827' }}>Notifications</h3>
                    </div>
                    <div style={{ padding: '30px 15px', textAlign: 'center', color: '#6b7280' }}>
                      <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>🔔</span>
                      <p>No new notifications</p>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f3f4f6',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    height: '36px',
                    width: '36px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                      {adminUser?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                      {adminUser?.name || 'Admin'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>Administrator</p>
                  </div>
                </button>

                {userMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    width: '200px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    zIndex: 50
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                        {adminUser?.name || 'Admin User'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>
                        {adminUser?.email || 'admin@studyreuse.com'}
                      </p>
                    </div>
                    <div style={{ padding: '8px 0' }}>
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '8px 16px',
                          fontSize: '14px',
                          color: '#dc2626',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <span>🚪</span>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: '30px',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            minHeight: 'calc(100vh - 150px)'
          }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Close menus when clicking outside */}
      {(notificationsOpen || userMenuOpen) && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40
          }}
          onClick={() => {
            setNotificationsOpen(false);
            setUserMenuOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default AdminLayout;