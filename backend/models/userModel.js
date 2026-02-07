const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockedReason: {
      type: String,
      default: null
    },
    blockedAt: {
      type: Date,
      default: null
    },
    lastLogin: {
      type: Date,
      default: null
    },
    loginCount: {
      type: Number,
      default: 0
    },
    profileComplete: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔍 Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update last login
userSchema.methods.updateLogin = async function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  await this.save();
};

// Static methods for analytics
userSchema.statics.getAnalytics = async function() {
  const totalUsers = await this.countDocuments();
  
  const usersByMonth = await this.aggregate([
    {
      $group: {
        _id: { 
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { 
      $sort: { "_id.year": 1, "_id.month": 1 } 
    },
    {
      $project: {
        month: {
          $concat: [
            { $toString: "$_id.year" },
            "-",
            { 
              $toString: { 
                $cond: [
                  { $lt: ["$_id.month", 10] },
                  { $concat: ["0", { $toString: "$_id.month" }] },
                  { $toString: "$_id.month" }
                ]
              }
            }
          ]
        },
        count: 1,
        _id: 0
      }
    }
  ]);

  const activeUsers = await this.countDocuments({ 
    isActive: true,
    lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  });

  const blockedUsers = await this.countDocuments({ isBlocked: true });

  return {
    totalUsers,
    activeUsers,
    blockedUsers,
    usersByMonth,
    activePercentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0
  };
};

// Get user growth
userSchema.statics.getUserGrowth = async function() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const [currentMonth, previousMonth] = await Promise.all([
    this.countDocuments({ 
      createdAt: { 
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      }
    }),
    this.countDocuments({
      createdAt: { 
        $gte: lastMonth,
        $lt: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1)
      }
    })
  ]);

  const growthRate = previousMonth > 0 
    ? (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(2)
    : currentMonth > 0 ? "100.00" : "0.00";

  return {
    currentMonth,
    previousMonth,
    growthRate: parseFloat(growthRate)
  };
};

module.exports = mongoose.model("User", userSchema);