// src/pages/admin/AdminDashboardPage.jsx
import { useEffect, useState } from 'react';
// CHANGE THIS:
// import { getDashboardStats } from "../../../services/adminService";
// TO THIS:
import apiService from "../../services/api"; // or apiService

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // USE apiService INSTEAD:
      const data = await apiService.admin.getDashboardStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '16rem'
      }}>
        <div style={{
          animation: 'spin 1s linear infinite',
          borderRadius: '9999px',
          height: '3rem',
          width: '3rem',
          borderBottom: '2px solid #2563eb',
          borderLeft: '2px solid transparent',
          borderRight: '2px solid transparent',
          borderTop: '2px solid transparent'
        }}></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: '#3b82f6',
      change: `${stats?.userGrowth || 0}%`,
      trend: '📈'
    },
    {
      title: 'Total Items',
      value: stats?.totalItems || 0,
      icon: '📦',
      color: '#10b981',
      change: `${stats?.itemGrowth || 0}%`,
      trend: '📈'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: '⚡',
      color: '#8b5cf6',
      description: 'Last 30 days'
    },
    {
      title: 'Pending Items',
      value: stats?.pendingItems || 0,
      icon: '⏳',
      color: '#f59e0b',
      status: 'Needs Review'
    },
    {
      title: 'Approved Items',
      value: stats?.verifiedItems || 0,
      icon: '✅',
      color: '#059669',
      status: 'Verified'
    },
    {
      title: 'Blocked Users',
      value: stats?.blockedUsers || 0,
      icon: '🚫',
      color: '#ef4444',
      status: 'Restricted'
    },
  ];

  return (
    <div>
      <h1 style={{
        fontSize: '1.875rem',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '1.5rem'
      }}>
        <span style={{ marginRight: '0.5rem' }}>📊</span>
        Dashboard Overview
      </h1>
      
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {statCards.map((stat) => (
          <div
            key={stat.title}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              padding: '1.5rem',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0,
                  fontWeight: 500
                }}>
                  {stat.title}
                </p>
                <p style={{
                  fontSize: '1.875rem',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: '0.5rem 0'
                }}>
                  {stat.value.toLocaleString()}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {stat.change && (
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#059669',
                      margin: 0,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span style={{ marginRight: '0.25rem' }}>{stat.trend}</span>
                      {stat.change} increase
                    </p>
                  )}
                  {stat.status && (
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem',
                      backgroundColor: stat.status === 'Restricted' ? '#fee2e2' : 
                                      stat.status === 'Verified' ? '#d1fae5' : '#fef3c7',
                      color: stat.status === 'Restricted' ? '#991b1b' : 
                            stat.status === 'Verified' ? '#065f46' : '#92400e',
                      borderRadius: '9999px',
                      fontWeight: 500
                    }}>
                      {stat.status}
                    </span>
                  )}
                </div>
              </div>
              <div style={{
                backgroundColor: stat.color,
                padding: '0.75rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '3.5rem',
                height: '3.5rem'
              }}>
                <span style={{
                  fontSize: '1.5rem'
                }}>
                  {stat.icon}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(24rem, 1fr))',
        gap: '1.5rem'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          padding: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ marginRight: '0.5rem' }}>⚡</span>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.75rem 1rem',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              '&:hover': {
                backgroundColor: '#dbeafe'
              }
            }}>
              <span>🔍</span>
              Review Pending Items
            </button>
            <button style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.75rem 1rem',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              '&:hover': {
                backgroundColor: '#fde68a'
              }
            }}>
              <span>🚩</span>
              View Flagged Content
            </button>
            <button style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.75rem 1rem',
              backgroundColor: '#f5f3ff',
              color: '#7c3aed',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              '&:hover': {
                backgroundColor: '#ede9fe'
              }
            }}>
              <span>📢</span>
              Send Notification
            </button>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          padding: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ marginRight: '0.5rem' }}>🕒</span>
            Recent Activity
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div>
                <p style={{
                  fontWeight: 500,
                  color: '#1f2937',
                  margin: 0,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span>👤</span>
                  New user registered
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0'
                }}>
                  <span style={{ marginRight: '0.25rem' }}>🕐</span>
                  5 minutes ago
                </p>
              </div>
              <span style={{
                padding: '0.125rem 0.5rem',
                fontSize: '0.75rem',
                backgroundColor: '#d1fae5',
                color: '#065f46',
                borderRadius: '9999px',
                fontWeight: 500
              }}>
                User
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div>
                <p style={{
                  fontWeight: 500,
                  color: '#1f2937',
                  margin: 0,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span>✅</span>
                  Item approved
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0'
                }}>
                  <span style={{ marginRight: '0.25rem' }}>🕐</span>
                  1 hour ago
                </p>
              </div>
              <span style={{
                padding: '0.125rem 0.5rem',
                fontSize: '0.75rem',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '9999px',
                fontWeight: 500
              }}>
                Item
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  fontWeight: 500,
                  color: '#1f2937',
                  margin: 0,
                  fontSize: '0.875',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span>🚫</span>
                  User blocked
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0'
                }}>
                  <span style={{ marginRight: '0.25rem' }}>🕐</span>
                  2 hours ago
                </p>
              </div>
              <span style={{
                padding: '0.125rem 0.5rem',
                fontSize: '0.75rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: '9999px',
                fontWeight: 500
              }}>
                Action
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;