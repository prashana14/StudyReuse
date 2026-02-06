// src/pages/admin/layout/AdminLayout.jsx
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useState } from 'react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Handle window resize for responsive behavior
  useState(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const styles = {
    // Container styles
    container: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#111827',
      lineHeight: 1.5,
    },
    
    // Layout wrapper
    layoutWrapper: {
      display: 'flex',
      minHeight: '100vh',
      position: 'relative',
    },
    
    // Mobile toggle button
    mobileToggle: {
      position: 'fixed',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      width: '44px',
      height: '44px',
      backgroundColor: '#1f2937',
      color: 'white',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      ':hover': {
        backgroundColor: '#374151',
        transform: 'translateY(-1px)',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
      },
    },
    
    // Desktop sidebar container
    desktopSidebar: {
      display: isDesktop ? 'block' : 'none',
      width: '280px',
      flexShrink: 0,
      borderRight: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
    },
    
    // Mobile sidebar overlay
    mobileOverlay: {
      position: 'fixed',
      inset: 0,
      zIndex: 999,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(2px)',
      animation: 'fadeIn 0.2s ease-out',
    },
    
    // Mobile sidebar container
    mobileSidebarContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 1000,
      width: '280px',
      backgroundColor: '#ffffff',
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
      animation: 'slideIn 0.3s ease-out',
      transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s ease-out',
    },
    
    // Main content area
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      backgroundColor: '#f9fafb',
    },
    
    // Content wrapper
    contentWrapper: {
      flex: 1,
      padding: isDesktop ? '32px 40px' : '24px',
      overflow: 'auto',
    },
    
    // Content area
    contentArea: {
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: isDesktop ? '32px' : '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
    },
    
    // Animation keyframes
    keyframes: {
      '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      '@keyframes slideIn': {
        from: { transform: 'translateX(-100%)' },
        to: { transform: 'translateX(0)' },
      },
    },
  };

  return (
    <div style={styles.container}>
      {/* Add keyframes styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      <div style={styles.layoutWrapper}>
        {/* Mobile toggle button with emoji */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={styles.mobileToggle}
          aria-label={sidebarOpen ? "Close navigation menu 📂" : "Open navigation menu 📁"}
          title={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? (
            <span style={{ fontSize: '20px' }}>✕</span>
          ) : (
            <span style={{ fontSize: '20px' }}>☰</span>
          )}
        </button>

        {/* Desktop sidebar */}
        <div style={styles.desktopSidebar}>
          <AdminSidebar />
        </div>

        {/* Mobile sidebar overlay and sidebar */}
        <div style={sidebarOpen ? styles.mobileOverlay : { display: 'none' }}
             onClick={() => setSidebarOpen(false)}>
          <div style={styles.mobileSidebarContainer} onClick={(e) => e.stopPropagation()}>
            <AdminSidebar />
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '4px',
                borderRadius: '6px',
                ':hover': {
                  backgroundColor: '#f3f4f6',
                },
              }}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div style={styles.mainContent}>
          {/* Admin Header with emoji in title */}
          <AdminHeader title={
            <>
              <span style={{ marginRight: '8px' }}>📊</span>
              Admin Dashboard
              <span style={{
                fontSize: '14px',
                color: '#6b7280',
                marginLeft: '12px',
                fontWeight: 'normal'
              }}>
                Control Panel
              </span>
            </>
          } />
          
          {/* Main content */}
          <div style={styles.contentWrapper}>
            <div style={styles.contentArea}>
              {/* Add subtle welcome message with emoji */}
              <div style={{
                display: 'none', // Hidden by default, can be shown conditionally
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#f0f9ff',
                borderRadius: '12px',
                borderLeft: '4px solid #0ea5e9',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>👋</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0369a1' }}>
                      Welcome back!
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#475569' }}>
                      Manage your platform efficiently from this dashboard
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Page content */}
              <Outlet />
            </div>
            
            {/* Footer with emoji */}
            <footer style={{
              marginTop: '32px',
              textAlign: 'center',
              padding: '16px',
              color: '#6b7280',
              fontSize: '14px',
              borderTop: '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>🔒</span>
                <span>Secure Admin Panel • {new Date().getFullYear()}</span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;