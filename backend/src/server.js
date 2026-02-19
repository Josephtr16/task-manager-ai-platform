const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use(cors());

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/tasks/:id', require('./routes/timeTracking'));
app.use('/api/tasks/:id/subtasks', require('./routes/subtasks'));
app.use('/api/analytics', require('./routes/analytics'));

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Task Manager API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth (register, login, me)',
      tasks: '/api/tasks (CRUD + statistics)',
    },
  });
});

const errorMiddleware = require('./middleware/errorMiddleware');

// Error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});