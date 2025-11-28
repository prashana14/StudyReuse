require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, "127.0.0.1", () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    process.exit(1); // Stop server if DB not connected
  });
