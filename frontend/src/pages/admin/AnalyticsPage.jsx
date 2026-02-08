// frontend/src/pages/admin/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  const STATUS_COLORS = {
    'Available': '#10B981',
    'Sold': '#EF4444',
    'Sold Out': '#F59E0B',
    'Under Negotiation': '#3B82F6',
    'Unavailable': '#6B7280',
    'reserved': '#8B5CF6'
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:4000/api/admin/analytics?timeRange=${timeRange}`, {
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.success) {
        setAnalyticsData(data.data);
        setLastUpdated(new Date(data.data.generatedAt || new Date().toISOString()));
        console.log('✅ Analytics data loaded successfully');
      } else {
        throw new Error(data?.message || 'Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Format Nepali Rs. currency
  const formatNPR = (amount) => {
    if (amount === null || amount === undefined || amount === 0) return 'Rs. 0';
    const num = Number(amount);
    if (isNaN(num)) return 'Rs. 0';
    return 'Rs. ' + num.toLocaleString('en-IN');
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('en-IN');
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${Math.round(value)}%`;
  };

  const getEmojiForCategory = (category) => {
    const emojiMap = {
      'books': '📚',
      'Stationery': '✏️',
      'Textbooks': '📖',
      'Lab Equipment': '🧪',
      'Electronics': '💻',
      'stationery': '✏️',
      'Study Guides': '📝'
    };
    return emojiMap[category] || '📦';
  };

  if (loading && !analyticsData) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '70vh'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #e5e7eb',
            borderTop: '5px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <p style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '10px'
          }}>Loading Dashboard...</p>
          <p style={{ color: '#6b7280' }}>Fetching real-time data from database</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '70vh',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
          <div style={{
            fontSize: '16px',
            color: '#ef4444',
            marginBottom: '20px',
            backgroundColor: '#fee2e2',
            padding: '15px',
            borderRadius: '8px',
            maxWidth: '500px'
          }}>
            <strong>Error:</strong> {error || 'Failed to load dashboard data'}
          </div>
          <button 
            onClick={fetchAnalyticsData}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🔄</span> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Prepare stats cards
  const statsCards = [
    {
      title: 'Total Users',
      value: formatNumber(analyticsData.overallStats?.totalUsers || 0),
      icon: '👥',
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      description: `${formatNumber(analyticsData.userStats?.active || 0)} active • ${formatPercent(analyticsData.userStats?.activePercentage)}`
    },
    {
      title: 'Total Items',
      value: formatNumber(analyticsData.overallStats?.totalItems || 0),
      icon: '📦',
      color: '#10B981',
      bgColor: '#D1FAE5',
      description: `${formatPercent(analyticsData.itemStats?.availablePercentage)} available • ${formatPercent(analyticsData.itemStats?.approvalPercentage)} approved`
    },
    {
      title: 'Available Items',
      value: formatNumber(analyticsData.overallStats?.availableItems || 0),
      icon: '✅',
      color: '#8B5CF6',
      bgColor: '#EDE9FE',
      description: 'Ready for purchase'
    },
    {
      title: 'Total Reviews',
      value: formatNumber(analyticsData.overallStats?.totalReviews || 0),
      icon: '⭐',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      description: `Avg rating: ${analyticsData.averageRating?.average?.toFixed(1) || '0.0'} / 5.0`
    },
    {
      title: 'Blocked Users',
      value: formatNumber(analyticsData.userStats?.blocked || 0),
      icon: '🚫',
      color: '#DC2626',
      bgColor: '#FEE2E2',
      description: `${formatPercent(analyticsData.userStats?.blockedPercentage)} of total users`
    },
    {
      title: 'Pending Items',
      value: formatNumber(analyticsData.itemStats?.pending || 0),
      icon: '⏳',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      description: 'Need approval'
    }
  ];

  // Prepare category data with correct emojis
  const categoryData = analyticsData.categoryDistribution?.map(cat => ({
    ...cat,
    emoji: getEmojiForCategory(cat.name),
    fill: COLORS[analyticsData.categoryDistribution.indexOf(cat) % COLORS.length]
  })) || [];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Header - Simplified without analytics branding */}
      <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
              Dashboard Overview
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '5px 0 0 0' }}>
              Real-time system insights and statistics
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
            
            <button 
              onClick={fetchAnalyticsData}
              style={{
                padding: '8px 12px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Refresh data"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {statsCards.map((stat, index) => (
          <div key={index} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            transition: 'transform 0.2s',
            cursor: 'pointer',
            ':hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: stat.bgColor,
              color: stat.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '15px'
            }}>
              {stat.icon}
            </div>
            <h3 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 5px 0'
            }}>{stat.value}</h3>
            <p style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              margin: '0 0 5px 0'
            }}>{stat.title}</p>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: 0
            }}>{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '25px',
        marginBottom: '30px'
      }}>
        {/* Monthly Trend */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📅</span> Item Listing Trend ({analyticsData.timeRangeUsed || 'month'})
          </h3>
          <div style={{ height: '300px' }}>
            {analyticsData.monthlyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value) => [`${value} items`, 'Count']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="items" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.2}
                    name="Items Listed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#6b7280'
              }}>
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🏷️</span> Items by Category
          </h3>
          <div style={{ height: '300px' }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.emoji} ${entry.percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      const percentage = props.payload.percentage || 0;
                      return [`${value} items (${percentage}%)`, props.payload.name];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#6b7280'
              }}>
                No category data available
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📊</span> Items by Status
          </h3>
          <div style={{ height: '300px' }}>
            {analyticsData.statusDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value) => [`${value} items`, 'Count']}
                    labelFormatter={(label) => `Status: ${label}`}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Items"
                    radius={[4, 4, 0, 0]}
                  >
                    {analyticsData.statusDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.name] || '#6B7280'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#6b7280'
              }}>
                No status data available
              </div>
            )}
          </div>
        </div>

        {/* Rating Overview */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⭐</span> Ratings Overview
          </h3>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px'
          }}>
            <div style={{
              fontSize: '48px',
              color: '#F59E0B',
              marginBottom: '10px'
            }}>
              ⭐
            </div>
            <div style={{
              fontSize: '64px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '5px'
            }}>
              {analyticsData.averageRating?.average?.toFixed(1) || '0.0'}
            </div>
            <div style={{ color: '#6b7280', marginBottom: '15px' }}>
              out of 5.0 stars
            </div>
            <div style={{
              backgroundColor: '#FEF3C7',
              padding: '10px 20px',
              borderRadius: '20px',
              color: '#92400E',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Based on {analyticsData.averageRating?.itemsWithRating || 0} reviews
            </div>
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#6b7280' }}>
              Range: {analyticsData.averageRating?.minRating || 0} - {analyticsData.averageRating?.maxRating || 5}
            </div>
          </div>
        </div>
      </div>

      {/* Top Items Table */}
      {analyticsData.topItems?.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '30px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
             Most Viewed Items (Top 10)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Rank</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Item</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Category</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Owner</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Price</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topItems.slice(0, 10).map((item, index) => (
                  <tr key={item.id || index} style={{ borderBottom: '1px solid #f3f4f6', ':hover': { backgroundColor: '#f9fafb' } }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#111827' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong>#{item.rank}</strong>
                        {item.rank <= 3 && (
                          <span style={{
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>
                            {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#111827' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>{item.emoji || '📦'}</span>
                        <div>
                          <div style={{ fontWeight: '500' }}>
                            {item.title?.substring(0, 30) || 'Untitled Item'}
                            {item.title?.length > 30 && '...'}
                          </div>
                          {item.rating > 0 && (
                            <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>⭐</span>
                              <span>{item.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#111827' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#E0E7FF',
                        color: '#3730A3',
                        display: 'inline-block'
                      }}>
                        {item.category || 'Other'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#111827' }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>{item.owner}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.ownerEmail}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#111827' }}>
                      <strong>{formatNPR(item.price || 0)}</strong>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#111827' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: STATUS_COLORS[item.status] ? `${STATUS_COLORS[item.status]}20` : '#F3F4F6',
                        color: STATUS_COLORS[item.status] || '#6B7280'
                      }}>
                        {item.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Items Needing Attention */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '30px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚠️</span> Items Needing Attention
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div style={{
            backgroundColor: '#FEF2F2',
            padding: '15px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'transform 0.2s',
            cursor: 'pointer',
            ':hover': { transform: 'translateY(-2px)' }
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px', color: '#DC2626' }}>📉</span>
              <div>
                <p style={{ margin: 0, fontWeight: '500' }}>Low Stock Items</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Quantity ≤ 3</p>
              </div>
            </div>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#DC2626' }}>
              {analyticsData.itemsNeedingAttention?.lowStock || 0}
            </span>
          </div>
          
          <div style={{
            backgroundColor: '#FFFBEB',
            padding: '15px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'transform 0.2s',
            cursor: 'pointer',
            ':hover': { transform: 'translateY(-2px)' }
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px', color: '#D97706' }}>⏳</span>
              <div>
                <p style={{ margin: 0, fontWeight: '500' }}>Pending Approval</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Need review</p>
              </div>
            </div>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#D97706' }}>
              {analyticsData.itemsNeedingAttention?.notApproved || 0}
            </span>
          </div>
          
          <div style={{
            backgroundColor: '#F5F3FF',
            padding: '15px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'transform 0.2s',
            cursor: 'pointer',
            ':hover': { transform: 'translateY(-2px)' }
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px', color: '#7C3AED' }}>🚩</span>
              <div>
                <p style={{ margin: 0, fontWeight: '500' }}>Flagged Items</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Reported by users</p>
              </div>
            </div>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#7C3AED' }}>
              {analyticsData.itemsNeedingAttention?.flagged || 0}
            </span>
          </div>

          <div style={{
            backgroundColor: '#F0FDF4',
            padding: '15px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'transform 0.2s',
            cursor: 'pointer',
            ':hover': { transform: 'translateY(-2px)' }
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px', color: '#059669' }}>📈</span>
              <div>
                <p style={{ margin: 0, fontWeight: '500' }}>Approval Rate</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Items approved</p>
              </div>
            </div>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
              {formatPercent(analyticsData.itemStats?.approvalPercentage)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '12px'
      }}>
        <p>Dashboard • Data refreshes on change</p>
        <p style={{ marginTop: '10px' }}>
          <button 
            onClick={fetchAnalyticsData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🔄 Refresh Data Now
          </button>
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPage;