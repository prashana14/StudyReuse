// src/pages/admin/layout/AdminHeader.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const AdminHeader = ({ title }) => {
  const [adminData, setAdminData] = useState(null);
  const [currentTime, setCurrentTime] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        console.log('Fetching admin data...');
        
        // FIRST: Check localStorage for admin data
        const storedAdminData = localStorage.getItem('adminData');
        const adminToken = localStorage.getItem('adminToken');
        const userData = localStorage.getItem('user');
        const userToken = localStorage.getItem('token');
        
        console.log('LocalStorage check:', {
          hasAdminData: !!storedAdminData,
          hasAdminToken: !!adminToken,
          hasUserData: !!userData,
          hasUserToken: !!userToken
        });
        
        let adminInfo = null;
        
        // Option 1: Parse adminData from localStorage
        if (storedAdminData) {
          try {
            const parsedData = JSON.parse(storedAdminData);
            console.log('Parsed admin data:', parsedData);
            
            // Handle different response structures
            if (parsedData.name && parsedData.email) {
              adminInfo = parsedData;
            } else if (parsedData.admin) {
              adminInfo = parsedData.admin;
            } else if (parsedData.data?.admin) {
              adminInfo = parsedData.data.admin;
            } else if (parsedData.username) {
              // This might be user data stored as admin
              adminInfo = {
                name: parsedData.name || parsedData.username,
                email: parsedData.email
              };
            }
          } catch (parseError) {
            console.error('Error parsing admin data:', parseError);
          }
        }
        
        // Option 2: If no admin data, check user data (user might be admin)
        if (!adminInfo && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            console.log('Parsed user data:', parsedUser);
            
            // Check if user is admin (based on role or isAdmin flag)
            if (parsedUser.role === 'admin' || parsedUser.isAdmin) {
              adminInfo = {
                name: parsedUser.name || parsedUser.username,
                email: parsedUser.email
              };
              // Also save as admin data for future
              localStorage.setItem('adminData', JSON.stringify(adminInfo));
            }
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
          }
        }
        
        // Option 3: Fetch admin profile from API
        if (!adminInfo && (adminToken || userToken)) {
          try {
            console.log('Fetching admin profile from API...');
            const response = await apiService.admin.getAdminProfile();
            console.log('Admin profile API response:', response);
            
            if (response) {
              if (response.admin) {
                adminInfo = response.admin;
              } else if (response.data) {
                adminInfo = response.data;
              } else if (response.name || response.email) {
                adminInfo = response;
              }
              
              if (adminInfo) {
                localStorage.setItem('adminData', JSON.stringify(adminInfo));
              }
            }
          } catch (apiError) {
            console.warn('Could not fetch admin profile from API:', apiError);
          }
        }
        
        // Set admin data or use fallback
        if (adminInfo) {
          console.log('Setting admin info:', adminInfo);
          setAdminData(adminInfo);
        } else {
          // Use fallback that doesn't say "System Administrator"
          console.log('Using fallback admin data');
          const fallbackData = {
            name: 'Administrator',
            email: 'administrator@studyreuse.com'
          };
          setAdminData(fallbackData);
        }
        
      } catch (error) {
        console.error('Error fetching admin data:', error);
        // Use nicer fallback
        setAdminData({
          name: 'Administrator',
          email: 'administrator@studyreuse.com'
        });
      }
    };
    
    fetchAdminData();
    
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
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const getInitials = (name) => {
    if (!name || name === 'Administrator') return '👨‍💼';
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

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
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
      position: 'relative',
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
    
    logoutButton: {
      padding: '8px 20px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    
    logoutButtonHover: {
      backgroundColor: '#2563eb',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    },
  };

  return (
    <header style={styles.header}>
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
              <span>Welcome back, {adminData?.name || 'Administrator'}</span>
            </div>
          </div>

          {/* Right Side - Time Display and Logout */}
          <div style={styles.rightSide}>
            {/* Time Display */}
            <div style={styles.timeDisplay}>
              <span>🕐</span>
              <span style={styles.timeText}>{currentTime}</span>
            </div>

            {/* Admin Profile Info */}
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
            >
              <div style={styles.profileInfo}>
                <p style={styles.adminName}>
                  <span>👨‍💼</span>
                  {adminData?.name || 'Administrator'}
                </p>
                <p style={styles.adminEmail}>
                  <span>📧</span>
                  {adminData?.email || 'administrator@studyreuse.com'}
                </p>
              </div>
              
              <div style={styles.avatar}>
                <div style={styles.avatarCircle}>
                  {getInitials(adminData?.name || 'Administrator')}
                </div>
                <div style={styles.statusIndicator}></div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              style={styles.logoutButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = styles.logoutButtonHover.backgroundColor;
                e.currentTarget.style.transform = styles.logoutButtonHover.transform;
                e.currentTarget.style.boxShadow = styles.logoutButtonHover.boxShadow;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
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
      {process.env.NODE_ENV === 'development' && (
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
          Admin: {adminData?.name || 'Administrator'}
          {adminData?.email && ` | ${adminData.email}`}
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
          
          .header-animated {
            animation: fadeIn 0.6s ease-out;
          }
        `}
      </style>
    </header>
  );
};

export default AdminHeader;