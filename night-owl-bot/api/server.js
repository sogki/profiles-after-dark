import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { loadConfig } from '../utils/config.js';
import rateLimit from 'express-rate-limit';
import v1Router from './routes/v1/index.js';
import { trackMetric } from './middleware/metrics.js';

dotenv.config();

// Load configuration from database
let config = {};

const app = express();
let PORT = 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://profilesafterdark.com',
      'https://www.profilesafterdark.com',
      'https://dev.profilesafterdark.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Metrics tracking middleware (before rate limiting to track all requests)
app.use('/api/', trackMetric);

app.use('/api/', limiter);

// ==========================================
// HEALTH CHECK
// ==========================================

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// ==========================================
// API ROUTES
// ==========================================

// API version 1
app.use('/api/v1', v1Router);

// Redirect /api to /api/v1
app.get('/api', (req, res) => {
  res.redirect('/api/v1');
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// ==========================================
// SERVER INITIALIZATION
// ==========================================

(async () => {
  try {
    // Load configuration from database
    console.log('📋 Loading configuration...');
    config = await loadConfig();
    
    PORT = config.PORT || process.env.PORT || 3000;
    
    // Get API_URL from database config, with fallbacks
    let API_URL = config.API_URL || process.env.API_URL;
    
    // If API_URL is not in database or env, try Railway environment variables
    if (!API_URL) {
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        // Railway provides the public domain
        API_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
        console.log(`🔗 Using Railway public domain: ${API_URL}`);
      } else {
        // Fallback to localhost
        API_URL = `http://localhost:${PORT}`;
        console.log(`⚠️  API_URL not set, using localhost fallback`);
      }
    } else {
      console.log(`✅ API_URL loaded from ${config.API_URL ? 'database' : 'environment'}: ${API_URL}`);
    }

    // Log all loaded config keys (without secrets)
    const publicConfig = Object.keys(config).filter(key => 
      !key.includes('TOKEN') && 
      !key.includes('KEY') && 
      !key.includes('SECRET')
    );
    console.log(`📦 Loaded config keys: ${publicConfig.join(', ')}`);

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 API Server running on port ${PORT}`);
      console.log(`📡 Health check: ${API_URL}/health`);
      console.log(`🌐 API v1: ${API_URL}/api/v1`);
      console.log(`🔗 Base URL: ${API_URL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start API server:', error);
    process.exit(1);
  }
})();

export default app;
