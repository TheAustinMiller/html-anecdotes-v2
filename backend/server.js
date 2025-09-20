require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./db'); // Your existing database class

// Import routes
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - allow credentials for cookie auth
app.use(cors({
  origin: 'http://localhost:4200', // Angular dev server
  credentials: true // Allow cookies to be sent/received
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Auth API Server Running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);

// Wait for database to be actually ready
function waitForDatabase() {
  return new Promise((resolve) => {
    const checkDB = () => {
      if (db.db) {
        console.log('Database connection verified');
        resolve();
      } else {
        console.log('Waiting for database...');
        setTimeout(checkDB, 500);
      }
    };
    checkDB();
  });
}

// Start server only after database is ready
async function startServer() {
  await waitForDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test with: curl http://localhost:${PORT}/`);
    console.log('Database ready and server started successfully');
  });
}

startServer();