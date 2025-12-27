// middleware/logger.js
const fs = require('fs');
const path = require('path');

const logError = (err, req) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id || 'anonymous'
  };
  
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  
  fs.appendFileSync(
    path.join(logDir, 'errors.log'),
    JSON.stringify(logEntry) + '\n'
  );
};

app.use((err, req, res, next) => {
  logError(err, req);
  console.error('Server Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});