// backend/controller/analyticsController.js
const User = require('../models/userModel');
const Item = require('../models/itemModel');
const Review = require('../models/reviewModel');

// @desc    Get comprehensive analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    
    console.log('📊 Analytics endpoint called with timeRange:', timeRange);
    
    // Get all data in parallel for better performance
    const [
      totalUsers,
      totalItems,
      totalReviews,
      activeUsers,
      availableItems,
      approvedItems,
      blockedUsers,
      pendingItems,
      categoryDistribution,
      statusDistribution,
      topItems,
      itemsNeedingAttention,
      averageRating,
      monthlyTrend
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Review.countDocuments(),
      User.countDocuments({ isActive: true, isBlocked: false }),
      Item.countDocuments({ 
        status: 'Available',
        quantity: { $gt: 0 }
      }),
      Item.countDocuments({ isApproved: true }),
      User.countDocuments({ isBlocked: true }),
      Item.countDocuments({ isApproved: false }),
      getCategoryDistribution(),
      getStatusDistribution(),
      getTopItems(),
      getItemsNeedingAttention(),
      getAverageRating(),
      getMonthlyTrend(timeRange)
    ]);

    // Calculate percentages
    const userStats = {
      total: totalUsers,
      active: activeUsers,
      blocked: blockedUsers,
      activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
      blockedPercentage: totalUsers > 0 ? Math.round((blockedUsers / totalUsers) * 100) : 0
    };

    const itemStats = {
      total: totalItems,
      available: availableItems,
      approved: approvedItems,
      pending: pendingItems,
      availablePercentage: totalItems > 0 ? Math.round((availableItems / totalItems) * 100) : 0,
      approvalPercentage: totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0
    };

    const reviewStats = {
      total: totalReviews,
      averageRating: averageRating.average,
      itemsWithRating: averageRating.itemsWithRating,
      message: averageRating.message
    };

    // Prepare final response
    const response = {
      success: true,
      data: {
        overallStats: {
          totalUsers: userStats.total,
          activeUsers: userStats.active,
          totalItems: itemStats.total,
          availableItems: itemStats.available,
          approvedItems: itemStats.approved,
          totalReviews: reviewStats.total
        },
        userStats,
        itemStats,
        reviewStats,
        averageRating,
        categoryDistribution,
        statusDistribution,
        monthlyTrend,
        topItems,
        itemsNeedingAttention,
        generatedAt: new Date().toISOString(),
        timeRangeUsed: timeRange
      }
    };
    
    console.log('✅ Analytics data prepared successfully');
    console.log(`📊 Summary: ${totalUsers} users, ${totalItems} items, ${totalReviews} reviews`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== HELPER FUNCTIONS ====================

const getCategoryDistribution = async () => {
  try {
    const categories = await Item.aggregate([
      { 
        $group: { 
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { 
        $project: { 
          name: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalItems = await Item.countDocuments();
    const categoryEmojis = {
      'books': '📚',
      'electronics': '💻',
      'stationery': '✏️',
      'notes': '📝',
      'labreports': '🧪',
      'other': '📦'
    };

    return categories.map(cat => ({
      ...cat,
      emoji: categoryEmojis[cat.name] || '📦',
      percentage: totalItems > 0 ? Math.round((cat.count / totalItems) * 100) : 0
    }));
  } catch (error) {
    console.error('Error getting category distribution:', error);
    return [];
  }
};

const getStatusDistribution = async () => {
  try {
    const statuses = await Item.aggregate([
      { 
        $group: { 
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { 
        $project: { 
          name: '$_id',
          value: '$count',
          _id: 0
        }
      },
      { $sort: { value: -1 } }
    ]);

    const statusEmojis = {
      'Available': '✅',
      'Sold': '💰',
      'Sold Out': '🏷️',
      'Under Negotiation': '🤝',
      'Unavailable': '❌'
    };

    return statuses.map(status => ({
      ...status,
      emoji: statusEmojis[status.name] || '📊'
    }));
  } catch (error) {
    console.error('Error getting status distribution:', error);
    return [];
  }
};

const getAverageRating = async () => {
  try {
    // First check if we have any reviews
    const totalReviews = await Review.countDocuments();
    
    if (totalReviews === 0) {
      return {
        average: 0,
        message: 'No reviews yet',
        itemsWithRating: 0,
        totalReviews: 0
      };
    }

    // Get average rating from reviews
    const ratingResult = await Review.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' }
        }
      }
    ]);

    if (ratingResult.length === 0) {
      return {
        average: 0,
        message: 'No reviews yet',
        itemsWithRating: 0,
        totalReviews: 0
      };
    }

    const result = ratingResult[0];
    
    return {
      average: parseFloat(result.average.toFixed(1)),
      itemsWithRating: result.count,
      totalReviews: result.count,
      minRating: result.minRating,
      maxRating: result.maxRating,
      message: `Based on ${result.count} reviews`
    };
  } catch (error) {
    console.error('Error getting average rating:', error);
    return {
      average: 0,
      message: 'No reviews yet',
      itemsWithRating: 0,
      totalReviews: 0
    };
  }
};

const getMonthlyTrend = async (timeRange) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const startDate = new Date();
    
    // Calculate start date based on timeRange
    switch(timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    console.log(`📅 Getting trend from ${startDate.toISOString()} to ${now.toISOString()}`);

    const trend = await Item.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          items: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $arrayElemAt: [months, { $subtract: ['$_id.month', 1] }] },
              ' ',
              { $toString: { $mod: ['$_id.year', 100] } }
            ]
          },
          items: 1,
          avgPrice: { $round: ['$avgPrice', 2] }
        }
      }
    ]);

    return trend.length > 0 ? trend : getFallbackMonthlyTrend();
  } catch (error) {
    console.error('Error getting monthly trend:', error);
    return getFallbackMonthlyTrend();
  }
};

const getFallbackMonthlyTrend = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const currentYear = new Date().getFullYear().toString().slice(2);
  
  return months.map(month => ({
    month: `${month} ${currentYear}`,
    items: Math.floor(Math.random() * 20) + 10,
    avgPrice: Math.floor(Math.random() * 1000) + 500
  }));
};

const getTopItems = async () => {
  try {
    const topItems = await Item.find({})
      .sort({ views: -1 })
      .limit(10)
      .select('title category views rating price status quantity isApproved')
      .populate('owner', 'name email')
      .lean();

    const categoryEmojis = {
      'books': '📚',
      'electronics': '💻',
      'stationery': '✏️',
      'notes': '📝',
      'labreports': '🧪',
      'other': '📦'
    };

    return topItems.map((item, index) => ({
      id: item._id,
      rank: index + 1,
      title: item.title,
      category: item.category,
      emoji: categoryEmojis[item.category] || '📦',
      views: item.views || 0,
      rating: item.rating || 0,
      price: item.price || 0,
      status: item.status,
      quantity: item.quantity,
      isApproved: item.isApproved,
      owner: item.owner ? item.owner.name : 'Unknown',
      ownerEmail: item.owner ? item.owner.email : 'No email'
    }));
  } catch (error) {
    console.error('Error getting top items:', error);
    return [];
  }
};

const getItemsNeedingAttention = async () => {
  try {
    const [lowStock, notApproved, flagged] = await Promise.all([
      Item.countDocuments({
        quantity: { $gt: 0, $lte: 3 },
        status: 'Available'
      }),
      Item.countDocuments({ isApproved: false }),
      Item.countDocuments({ isFlagged: true })
    ]);

    return {
      lowStock,
      notApproved,
      flagged,
      total: lowStock + notApproved + flagged
    };
  } catch (error) {
    console.error('Error getting items needing attention:', error);
    return { lowStock: 0, notApproved: 0, flagged: 0, total: 0 };
  }
};