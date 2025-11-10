require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');   // ✅ Step 1: Import express-fileupload
const cloudinary = require('cloudinary').v2;        // ✅ Step 2: Import Cloudinary

const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');

const app = express();

// ✅ Step 3: Configure Cloudinary (reads from .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Step 4: Middlewares
app.use(cors());
app.use(express.json());

// ✅ Step 5: Enable file uploads (add this line HERE 👇)
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

// ✅ Step 6: Routes
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);

// ✅ Step 7: MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ Connection Failed:', err.message));

// ✅ Step 8: Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
