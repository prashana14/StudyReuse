// backend/models/itemModels.js
const mongoose = require('mongoose');

const itemSchema = mongoose.Schema(
  {
    // Required fields
    title: { 
      type: String, 
      required: [true, 'Title is required'] 
    },
    description: { 
      type: String, 
      required: [true, 'Description is required'] 
    },
    price: { 
      type: Number, 
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    
    // QUANTITY FIELD - ADDED
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    
    // Category
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['books', 'notes', 'electronics', 'stationery', 'labreports', 'other'],
      default: 'books'
    },
    
    // Condition field
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: ['new', 'like-new', 'good', 'fair', 'poor'],
      default: 'good'
    },
    
    // Faculty field
    faculty: {
      type: String,
      enum: ['BBA', 'BITM', 'BBS', 'BBM', 'BBA-F', 'MBS', 'MBA', 'MITM', 'MBA-F', 'Other'],
      default: 'Other'
    },
    
    // Image field
    image: { 
      type: String, 
      required: [true, 'Image is required'] 
    },
    
    // Owner reference
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },

    // Status field - UPDATED ENUM
    status: {
      type: String,
      enum: ['Available', 'Sold', 'Sold Out', 'Under Negotiation', 'Unavailable'],
      default: 'Available'
    },
    
    // Item rating (average of all reviews)
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    
    // Number of reviews
    reviewCount: {
      type: Number,
      default: 0
    },
    
    // Approval fields
    isApproved: {
      type: Boolean,
      default: false
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    flagReason: String,
    adminNotes: String,
    approvedAt: Date,
    
    // Additional useful fields
    views: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

// Add virtual for image URL
itemSchema.virtual('imageURL').get(function() {
  if (this.image && this.image.startsWith('http')) {
    return this.image;
  }
  return this.image;
});

// Add virtual for availability
itemSchema.virtual('isAvailable').get(function() {
  return this.status === 'Available' && this.quantity > 0;
});

// Add virtual for low stock warning
itemSchema.virtual('isLowStock').get(function() {
  return this.quantity <= 3 && this.quantity > 0;
});

// Add virtual for revenue calculation (price * quantity sold)
itemSchema.virtual('revenue').get(function() {
  // This is a simple calculation - you might need to adjust based on your logic
  const soldQuantity = this.initialQuantity ? this.initialQuantity - this.quantity : 0;
  return soldQuantity * this.price;
});

// Pre-save hook to update status based on quantity
itemSchema.pre('save', function(next) {
  // Update status based on quantity
  if (this.quantity <= 0 && this.status !== 'Sold Out') {
    this.status = 'Sold Out';
  } else if (this.quantity > 0 && this.status === 'Sold Out') {
    this.status = 'Available';
  }
  next();
});

// Post-save hook
itemSchema.post('save', async function(doc, next) {
  try {
    // Only notify for new pending items (not when updating)
    if (doc.isNew && !doc.isApproved && !doc.isFlagged) {
      const adminController = require('../controller/adminController');
      await adminController.notifyNewItem(doc._id);
    }
  } catch (error) {
    console.error('Error in item post-save hook:', error);
  }
  next();
});

// ===========================
// ANALYTICS STATIC METHODS
// ===========================

/**
 * Get overall item statistics
 * @returns {Object} Item statistics
 */
itemSchema.statics.getOverallStats = async function() {
  const totalItems = await this.countDocuments();
  const approvedItems = await this.countDocuments({ isApproved: true });
  const availableItems = await this.countDocuments({ 
    status: 'Available',
    quantity: { $gt: 0 }
  });
  
  return {
    totalItems,
    approvedItems,
    pendingApproval: totalItems - approvedItems,
    availableItems,
    approvalRate: totalItems > 0 ? ((approvedItems / totalItems) * 100).toFixed(2) : 0
  };
};

/**
 * Get items by category distribution
 * @returns {Array} Category distribution data
 */
itemSchema.statics.getCategoryDistribution = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        avgRating: { $avg: '$rating' }
      }
    },
    {
      $project: {
        category: '$_id',
        count: 1,
        avgPrice: { $round: ['$avgPrice', 2] },
        avgRating: { $round: ['$avgRating', 2] },
        percentage: {
          $multiply: [
            { $divide: ['$count', { $sum: '$count' }] },
            100
          ]
        }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        category: 1,
        count: 1,
        avgPrice: 1,
        avgRating: 1,
        percentage: { $round: ['$percentage', 2] }
      }
    }
  ]);
};

/**
 * Get items by status distribution
 * @returns {Array} Status distribution data
 */
itemSchema.statics.getStatusDistribution = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        totalValue: { $round: ['$totalValue', 2] },
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * Get items by condition distribution
 * @returns {Array} Condition distribution data
 */
itemSchema.statics.getConditionDistribution = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$condition',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' }
      }
    },
    {
      $project: {
        condition: '$_id',
        count: 1,
        avgPrice: { $round: ['$avgPrice', 2] },
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * Get items by faculty distribution
 * @returns {Array} Faculty distribution data
 */
itemSchema.statics.getFacultyDistribution = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$faculty',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' }
      }
    },
    {
      $project: {
        faculty: '$_id',
        count: 1,
        avgPrice: { $round: ['$avgPrice', 2] },
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * Get average rating of all available items
 * Returns "No reviews yet" if no items have ratings
 * @returns {Object} Average rating info
 */
itemSchema.statics.getAverageRating = async function() {
  const result = await this.aggregate([
    {
      $match: {
        status: 'Available',
        quantity: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalItems: { $sum: 1 },
        itemsWithRating: {
          $sum: {
            $cond: [{ $gt: ['$rating', 0] }, 1, 0]
          }
        }
      }
    }
  ]);

  if (result.length === 0 || result[0].itemsWithRating === 0) {
    return {
      average: 0,
      message: 'No reviews yet',
      totalItems: result[0]?.totalItems || 0,
      itemsWithRating: 0
    };
  }

  return {
    average: parseFloat(result[0].avgRating.toFixed(2)),
    totalItems: result[0].totalItems,
    itemsWithRating: result[0].itemsWithRating,
    ratingPercentage: parseFloat(((result[0].itemsWithRating / result[0].totalItems) * 100).toFixed(2))
  };
};

/**
 * Get top items by views
 * @param {Number} limit - Number of top items to return
 * @returns {Array} Top items
 */
itemSchema.statics.getTopItemsByViews = async function(limit = 5) {
  return await this.find({})
    .sort({ views: -1 })
    .limit(limit)
    .select('title category views rating price status quantity')
    .populate('owner', 'name email')
    .lean();
};

/**
 * Get monthly item creation trend
 * @param {Number} months - Number of months to look back
 * @returns {Array} Monthly trend data
 */
itemSchema.statics.getMonthlyTrend = async function(months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return await this.aggregate([
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
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    },
    {
      $project: {
        _id: 0,
        period: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            { $toString: { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] } }
          ]
        },
        monthName: {
          $let: {
            vars: {
              months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            },
            in: {
              $arrayElemAt: ['$$months', { $subtract: ['$_id.month', 1] }]
            }
          }
        },
        count: 1,
        avgPrice: { $round: ['$avgPrice', 2] },
        totalValue: { $round: ['$totalValue', 2] }
      }
    }
  ]);
};

/**
 * Get price range distribution
 * @returns {Array} Price range data
 */
itemSchema.statics.getPriceRangeDistribution = async function() {
  const priceRanges = [
    { min: 0, max: 500, label: '0-500' },
    { min: 501, max: 1000, label: '501-1000' },
    { min: 1001, max: 2000, label: '1001-2000' },
    { min: 2001, max: 5000, label: '2001-5000' },
    { min: 5001, max: 10000, label: '5001-10000' },
    { min: 10001, max: Infinity, label: '10000+' }
  ];

  const results = [];

  for (const range of priceRanges) {
    const count = await this.countDocuments({
      price: { $gte: range.min, $lte: range.max }
    });
    
    results.push({
      range: range.label,
      count,
      minPrice: range.min,
      maxPrice: range.max
    });
  }

  return results;
};

/**
 * Get items needing attention (low stock, not approved, flagged)
 * @returns {Object} Items needing attention
 */
itemSchema.statics.getItemsNeedingAttention = async function() {
  const [lowStock, notApproved, flagged] = await Promise.all([
    this.countDocuments({
      quantity: { $gt: 0, $lte: 3 },
      status: 'Available'
    }),
    this.countDocuments({ isApproved: false }),
    this.countDocuments({ isFlagged: true })
  ]);

  return {
    lowStock,
    notApproved,
    flagged,
    total: lowStock + notApproved + flagged
  };
};

/**
 * Get comprehensive analytics for admin dashboard
 * @returns {Object} Comprehensive analytics data
 */
itemSchema.statics.getComprehensiveAnalytics = async function() {
  const [
    overallStats,
    categoryDistribution,
    statusDistribution,
    averageRating,
    monthlyTrend,
    priceRangeDistribution,
    topItems,
    itemsNeedingAttention
  ] = await Promise.all([
    this.getOverallStats(),
    this.getCategoryDistribution(),
    this.getStatusDistribution(),
    this.getAverageRating(),
    this.getMonthlyTrend(6),
    this.getPriceRangeDistribution(),
    this.getTopItemsByViews(10),
    this.getItemsNeedingAttention()
  ]);

  return {
    overallStats,
    categoryDistribution,
    statusDistribution,
    averageRating,
    monthlyTrend,
    priceRangeDistribution,
    topItems,
    itemsNeedingAttention,
    lastUpdated: new Date()
  };
};

// Ensure virtuals are included in JSON
itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Item', itemSchema);