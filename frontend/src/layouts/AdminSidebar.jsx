// src/pages/admin/layout/AdminSidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [activeItem, setActiveItem] = useState('');

  useEffect(() => {
    // Get admin data from localStorage
    try {
      const storedData = localStorage.getItem('adminData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setAdminData(parsedData);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊', description: 'Overview & Stats' },
    { name: 'Users', href: '/admin/users', icon: '👥', description: 'Manage Users' },
    { name: 'Items', href: '/admin/items', icon: '📦', description: 'Product Management' },
    { name: 'Orders', href: '/admin/orders', icon: '🛒', description: 'Order Tracking' },
    { name: 'Analytics', href: '/admin/analytics', icon: '📈', description: 'Reports & Insights' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️', description: 'System Settings' },
  ];

  const getInitials = (name) => {
    if (!name) return '👑';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const styles = {
    sidebar: {
      height: '100vh',
      width: '280px',
      backgroundColor: '#0f172a',
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      color: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #334155',
      boxShadow: '2px 0 20px rgba(0, 0, 0, 0.2)',
      position: 'relative',
      overflow: 'hidden',
    },
    
    // Logo Section
    logoSection: {
      padding: '28px 24px',
      borderBottom: '1px solid #334155',
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(10px)',
    },
    
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px',
    },
    
    logoIcon: {
      fontSize: '28px',
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    
    logoText: {
      fontSize: '20px',
      fontWeight: 700,
      background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      letterSpacing: '-0.5px',
    },
    
    tagline: {
      fontSize: '12px',
      color: '#94a3b8',
      margin: '4px 0 0 0',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    
    // Navigation Section
    navSection: {
      flex: 1,
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      overflowY: 'auto',
    },
    
    navLabel: {
      fontSize: '11px',
      color: '#64748b',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      margin: '16px 12px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    
    navItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px 16px',
      borderRadius: '12px',
      textDecoration: 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
    },
    
    navItemInactive: {
      backgroundColor: 'transparent',
      color: '#cbd5e1',
      border: '1px solid transparent',
    },
    
    navItemActive: {
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))',
      color: '#ffffff',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
    },
    
    navItemHover: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#ffffff',
      border: '1px solid #475569',
      transform: 'translateX(4px)',
    },
    
    navIcon: {
      fontSize: '18px',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.3s ease',
    },
    
    navIconActive: {
      transform: 'scale(1.1)',
    },
    
    navContent: {
      flex: 1,
    },
    
    navName: {
      fontSize: '14px',
      fontWeight: 500,
      margin: 0,
    },
    
    navDescription: {
      fontSize: '11px',
      color: '#94a3b8',
      margin: '2px 0 0 0',
      opacity: 0,
      maxHeight: 0,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    },
    
    navDescriptionActive: {
      opacity: 1,
      maxHeight: '20px',
    },
    
    activeIndicator: {
      position: 'absolute',
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: '#3b82f6',
      boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)',
    },
    
    // Profile Section
    profileSection: {
      padding: '20px 24px',
      borderTop: '1px solid #334155',
      background: 'rgba(15, 23, 42, 0.9)',
    },
    
    adminInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
      padding: '12px',
      backgroundColor: 'rgba(30, 41, 59, 0.7)',
      borderRadius: '12px',
      border: '1px solid #334155',
    },
    
    adminAvatar: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontWeight: 700,
      fontSize: '14px',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    },
    
    adminDetails: {
      flex: 1,
    },
    
    adminName: {
      fontSize: '13px',
      fontWeight: 600,
      color: '#f1f5f9',
      margin: '0 0 2px 0',
    },
    
    adminRole: {
      fontSize: '11px',
      color: '#94a3b8',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    
    // Logout Button
    logoutButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      width: '100%',
      padding: '14px',
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      color: '#fca5a5',
      borderRadius: '12px',
      border: '1px solid rgba(220, 38, 38, 0.3)',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      transition: 'all 0.3s ease',
    },
    
    logoutButtonHover: {
      backgroundColor: 'rgba(220, 38, 38, 0.2)',
      color: '#fecaca',
      borderColor: 'rgba(220, 38, 38, 0.5)',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
    },
    
    // Status Indicator
    statusIndicator: {
      fontSize: '11px',
      color: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      padding: '4px 8px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '8px',
    },
    
    // Decorative Elements
    decorativeElement: {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      height: '100px',
      background: 'linear-gradient(transparent, rgba(59, 130, 246, 0.05))',
      pointerEvents: 'none',
    },
  };

  return (
    <div style={styles.sidebar}>
      {/* Logo Section */}
      <div style={styles.logoSection}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>👑</div>
          <div style={styles.logoText}>Admin Panel</div>
        </div>
        <p style={styles.tagline}>
          <span>⚡</span>
          StudyReuse Management System
        </p>
      </div>

      {/* Navigation Section */}
      <div style={styles.navSection}>
        <div style={styles.navLabel}>
          <span>📋</span>
          <span>Navigation</span>
        </div>
        
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : styles.navItemInactive),
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.className.includes('active')) {
                e.currentTarget.style.backgroundColor = styles.navItemHover.backgroundColor;
                e.currentTarget.style.color = styles.navItemHover.color;
                e.currentTarget.style.border = styles.navItemHover.border;
                e.currentTarget.style.transform = styles.navItemHover.transform;
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.className.includes('active')) {
                e.currentTarget.style.backgroundColor = styles.navItemInactive.backgroundColor;
                e.currentTarget.style.color = styles.navItemInactive.color;
                e.currentTarget.style.border = styles.navItemInactive.border;
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            <div style={{
              ...styles.navIcon,
              ...(window.location.pathname === item.href ? styles.navIconActive : {})
            }}>
              {item.icon}
            </div>
            <div style={styles.navContent}>
              <p style={styles.navName}>{item.name}</p>
              <p style={{
                ...styles.navDescription,
                ...(window.location.pathname === item.href ? styles.navDescriptionActive : {})
              }}>
                {item.description}
              </p>
            </div>
            {window.location.pathname === item.href && (
              <div style={styles.activeIndicator}></div>
            )}
          </NavLink>
        ))}
      </div>

      {/* Profile & Logout Section */}
      <div style={styles.profileSection}>
        {/* Admin Info */}
        <div style={styles.adminInfo}>
          <div style={styles.adminAvatar}>
            {getInitials(adminData?.name || 'Admin')}
          </div>
          <div style={styles.adminDetails}>
            <p style={styles.adminName}>{adminData?.name || 'System Admin'}</p>
            <p style={styles.adminRole}>
              <span>🛡️</span>
              <span>Administrator</span>
            </p>
          </div>
        </div>

        {/* Status */}
        <div style={styles.statusIndicator}>
          <span>🟢</span>
          <span>System Online</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={styles.logoutButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = styles.logoutButtonHover.backgroundColor;
            e.currentTarget.style.color = styles.logoutButtonHover.color;
            e.currentTarget.style.borderColor = styles.logoutButtonHover.borderColor;
            e.currentTarget.style.transform = styles.logoutButtonHover.transform;
            e.currentTarget.style.boxShadow = styles.logoutButtonHover.boxShadow;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = styles.logoutButton.backgroundColor;
            e.currentTarget.style.color = styles.logoutButton.color;
            e.currentTarget.style.borderColor = styles.logoutButton.borderColor;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '16px' }}>🚪</span>
          <span>Logout Session</span>
        </button>
      </div>

      {/* Decorative Element */}
      <div style={styles.decorativeElement}></div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes glow {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { transform: translateX(-10px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          
          /* Custom Scrollbar */
          ::-webkit-scrollbar {
            width: 4px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(30, 41, 59, 0.3);
            border-radius: 2px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.5);
            border-radius: 2px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.7);
          }
          
          /* Smooth transitions */
          .nav-item-transition {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .active-indicator-glow {
            animation: glow 2s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default AdminSidebar;