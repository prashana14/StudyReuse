// src/pages/admin/layout/AdminHeader.jsx
import { useEffect, useState } from 'react';
import AdminNotificationBell from '../components/admin/AdminNotificationBell';

const AdminHeader = ({ title }) => {
  const [adminData, setAdminData] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Get admin data from localStorage
    try {
      const storedData = localStorage.getItem('adminData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setAdminData(parsedData);
        console.log('Admin data loaded:', parsedData);
      } else {
        console.log('No admin data found in localStorage');
        // Set default admin data
        setAdminData({
          name: 'System Administrator',
          email: 'admin@system.local'
        });
      }
    } catch (error) {
      console.error('Error parsing admin data:', error);
      // Fallback data
      setAdminData({
        name: 'System Administrator',
        email: 'admin@system.local'
      });
    }
    
    // Update time
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setCurrentTime(timeString);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const getInitials = (name) => {
    if (!name || name === 'System Administrator') return '👨‍💼';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 18) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  const getAdminName = () => {
    if (adminData?.name && adminData.name !== 'System Administrator') {
      return adminData.name;
    }
    return 'System Administrator';
  };

  const getAdminEmail = () => {
    if (adminData?.email && adminData.email !== 'admin@system.local') {
      return adminData.email;
    }
    return 'admin@system.local';
  };

  const styles = {
    header: {
      backgroundColor: '#ffffff',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
      borderBottom: '1px solid #e2e8f0',
      padding: '0',
      position: 'relative',
      overflow: 'hidden',
    },
    
    headerContainer: {
      position: 'relative',
      zIndex: 10,
      padding: '24px 32px',
    },
    
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
    },
    
    // Left Side - Title and Info
    leftSide: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    
    title: {
      fontSize: '28px',
      fontWeight: 700,
      color: '#0f172a',
      margin: 0,
      background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      letterSpacing: '-0.5px',
    },
    
    greeting: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      color: '#64748b',
      fontWeight: 500,
    },
    
    greetingBadge: {
      backgroundColor: '#e0f2fe',
      color: '#0369a1',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    
    // Right Side - Actions and Profile
    rightSide: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
    },
    
    timeDisplay: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#f1f5f9',
      padding: '8px 16px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
    },
    
    timeText: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#0f172a',
    },
    
    profileSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '8px 16px 8px 8px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    },
    
    profileSectionHover: {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      borderColor: '#cbd5e1',
      transform: 'translateY(-1px)',
    },
    
    profileInfo: {
      textAlign: 'right',
    },
    
    adminName: {
      fontSize: '15px',
      fontWeight: 600,
      color: '#0f172a',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    
    adminEmail: {
      fontSize: '13px',
      color: '#64748b',
      margin: '4px 0 0 0',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    
    avatar: {
      position: 'relative',
    },
    
    avatarCircle: {
      width: '48px',
      height: '48px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontWeight: 700,
      fontSize: '16px',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
      border: '3px solid #ffffff',
    },
    
    statusIndicator: {
      position: 'absolute',
      bottom: '0',
      right: '0',
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      backgroundColor: '#22c55e',
      border: '3px solid #ffffff',
      boxShadow: '0 2px 4px rgba(34, 197, 94, 0.3)',
    },
    
    // Decorative Elements
    decorativeCircle1: {
      position: 'absolute',
      top: '-60px',
      right: '-60px',
      width: '160px',
      height: '160px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
    },
    
    decorativeCircle2: {
      position: 'absolute',
      bottom: '-80px',
      left: '-80px',
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
    },
    
    // Separator
    separator: {
      height: '40px',
      width: '1px',
      backgroundColor: '#e2e8f0',
    },
    
    // Admin Menu (optional dropdown)
    adminMenu: {
      position: 'absolute',
      top: '100%',
      right: '0',
      marginTop: '8px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      minWidth: '200px',
      overflow: 'hidden',
      zIndex: 1000,
      animation: 'slideDown 0.2s ease-out',
    },
    
    menuItem: {
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: '#334155',
      fontSize: '14px',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      borderBottom: '1px solid #f1f5f9',
    },
    
    menuItemHover: {
      backgroundColor: '#f8fafc',
      color: '#3b82f6',
    },
    
    menuItemLast: {
      borderBottom: 'none',
    },
  };

  return (
    <header style={styles.header}>
      {/* Decorative Background Elements */}
      <div style={styles.decorativeCircle1}></div>
      <div style={styles.decorativeCircle2}></div>
      
      <div style={styles.headerContainer}>
        <div style={styles.headerContent}>
          {/* Left Side - Title and Greeting */}
          <div style={styles.leftSide}>
            <h1 style={styles.title}>{title}</h1>
            <div style={styles.greeting}>
              <div style={styles.greetingBadge}>
                <span>{getGreeting()}</span>
                <span>👋</span>
              </div>
              <span style={{ color: '#94a3b8' }}>|</span>
              <span>Welcome back, {getAdminName()}</span>
            </div>
          </div>

          {/* Right Side - Actions and Profile */}
          <div style={styles.rightSide}>
            {/* Notification Bell */}
            <AdminNotificationBell />

            {/* Separator */}
            <div style={styles.separator}></div>

            {/* Time Display */}
            <div style={styles.timeDisplay}>
              <span>🕐</span>
              <span style={styles.timeText}>{currentTime}</span>
            </div>

            {/* Admin Profile */}
            <div 
              style={styles.profileSection}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = styles.profileSectionHover.boxShadow;
                e.currentTarget.style.borderColor = styles.profileSectionHover.borderColor;
                e.currentTarget.style.transform = styles.profileSectionHover.transform;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => {
                console.log('Admin Profile clicked');
                console.log('Admin Data:', adminData);
                // You can add dropdown menu functionality here
              }}
            >
              <div style={styles.profileInfo}>
                <p style={styles.adminName}>
                  <span>👨‍💼</span>
                  {getAdminName()}
                </p>
                <p style={styles.adminEmail}>
                  <span>📧</span>
                  {getAdminEmail()}
                </p>
              </div>
              
              <div style={styles.avatar}>
                <div style={styles.avatarCircle}>
                  {getInitials(getAdminName())}
                </div>
                <div style={styles.statusIndicator}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Header Bottom Border Effect */}
      <div style={{
        height: '4px',
        background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%)',
        backgroundSize: '200% 100%',
        animation: 'gradientShift 3s ease infinite',
      }}></div>
      
      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && adminData && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          fontSize: '10px',
          color: '#94a3b8',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '2px 6px',
          borderRadius: '4px',
          zIndex: 100,
        }}>
          Admin: {getAdminName()}
        </div>
      )}
      
      {/* CSS Animations */}
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .header-animated {
            animation: fadeIn 0.6s ease-out;
          }
        `}
      </style>
    </header>
  );
};

export default AdminHeader;