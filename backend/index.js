require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');
const reminderRoutes = require('./routes/reminders');
const remindersAdvancedRoutes = require('./routes/reminders-advanced');
const analyticsRoutes = require('./routes/analytics');
const templatesRoutes = require('./routes/templates');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const plansRoutes = require('./routes/plans');
const propertiesRoutes = require('./routes/properties');
const dealsRoutes = require('./routes/deals');
const supportRoutes = require('./routes/support');
const apiV1Routes = require('./routes/api_v1');


const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// Connect Database
connectDB();

// Special handling for Stripe Webhook (needs raw body)
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://smart-reach-omega.vercel.app',
  'https://smartreach-crm.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow any onrender.com subdomain (service to service)
    if (origin.endsWith('.onrender.com')) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Auth rate limit (stricter)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth/', authLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SmartReach API is running 🚀', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reminders', remindersAdvancedRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/v1', apiV1Routes);


// Socket.IO events
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 SmartReach API running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}\n`);
});

// Reminder Checker Interval (checks every minute)
const Reminder = require('./models/Reminder');
setInterval(async () => {
  try {
    const now = new Date();
    const dueReminders = await Reminder.find({
      scheduledAt: { $lte: now },
      sent: false,
    }).populate('agent', '_id');

    for (const reminder of dueReminders) {
      io.to(`user_${reminder.agent._id}`).emit('reminder_due', {
        message: reminder.message,
        id: reminder._id,
      });
      reminder.sent = true;
      await reminder.save();
    }
  } catch (err) {
    console.error('Reminder check error:', err);
  }
}, 60000);

module.exports = { app, io };
