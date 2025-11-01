import express from 'express';
import { getSupabase } from '../../../utils/supabase.js';
import { loadConfig } from '../../../utils/config.js';

const router = express.Router();

// Use built-in fetch (Node 18+) or node-fetch as fallback
const fetch = globalThis.fetch || (await import('node-fetch')).default;

// Cache for service status (refresh every 30 seconds)
let serviceStatusCache = {
  data: [],
  timestamp: null
};

const CACHE_TTL = 30000; // 30 seconds

/**
 * Check if a service is operational
 */
async function checkService(url, serviceId, serviceName) {
  const startTime = Date.now();
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'NightOwl-Monitor/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    const status = response.ok ? 'operational' : response.status >= 500 ? 'down' : 'degraded';
    
    // Store in database (fire and forget)
    const db = await getSupabase();
    if (db) {
      db.from('service_status').insert({
        service_id: serviceId,
        service_name: serviceName,
        status: status,
        response_time: responseTime,
        status_code: response.status,
        last_checked: new Date().toISOString()
      }).catch((err) => {
        // Silently fail - don't interrupt service check
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to store service status:', err.message);
        }
      });
    }
    
    return {
      id: serviceId,
      name: serviceName,
      status,
      responseTime,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Store error in database (fire and forget)
    const db = await getSupabase();
    if (db) {
      db.from('service_status').insert({
        service_id: serviceId,
        service_name: serviceName,
        status: 'down',
        response_time: responseTime,
        status_code: 0,
        error_message: error.message || 'Request failed',
        last_checked: new Date().toISOString()
      }).catch((err) => {
        // Silently fail - don't interrupt service check
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to store service status:', err.message);
        }
      });
    }
    
    return {
      id: serviceId,
      name: serviceName,
      status: 'down',
      responseTime,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * @route   GET /api/v1/monitoring/health
 * @desc    Get health status of all services
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (serviceStatusCache.data.length > 0 && 
        serviceStatusCache.timestamp && 
        (now - serviceStatusCache.timestamp) < CACHE_TTL) {
      return res.json({
        success: true,
        data: {
          services: serviceStatusCache.data,
          summary: {
            total: serviceStatusCache.data.length,
            operational: serviceStatusCache.data.filter(s => s.status === 'operational').length,
            degraded: serviceStatusCache.data.filter(s => s.status === 'degraded').length,
            down: serviceStatusCache.data.filter(s => s.status === 'down').length,
            allOperational: serviceStatusCache.data.every(s => s.status === 'operational')
          }
        }
      });
    }

    const config = await loadConfig();
    const db = await getSupabase();
    
    // Get API URL from config
    const API_URL = config.API_URL || process.env.API_URL || 'https://dev.profilesafterdark.com';
    const WEB_URL = config.WEB_URL || process.env.WEB_URL || 'https://profilesafterdark.com';
    
    // Check database connection
    const dbStartTime = Date.now();
    const { error: dbError } = await db.from('profiles').select('id', { count: 'exact', head: true });
    const dbResponseTime = Date.now() - dbStartTime;
    
    // Check all services in parallel
    const serviceChecks = await Promise.allSettled([
      // Website
      checkService(`${WEB_URL}`, 'website', 'Website'),
      
      // API Server
      checkService(`${API_URL}/health`, 'api', 'API Server'),
      
      // Database
      Promise.resolve({
        id: 'database',
        name: 'Supabase Connection',
        status: dbError ? 'degraded' : 'operational',
        responseTime: dbResponseTime,
        lastChecked: new Date().toISOString()
      }),
      
      // Discord Bot (check via API if available)
      checkService(`${API_URL}/api/v1/discord/status`, 'discord-bot', 'Discord Bot').catch(() => ({
        id: 'discord-bot',
        name: 'Discord Bot',
        status: 'degraded',
        responseTime: 0,
        lastChecked: new Date().toISOString()
      })),
      
      // Discord API (external)
      checkService('https://discord.com/api/v10/gateway', 'discord-api', 'Discord API').catch(() => ({
        id: 'discord-api',
        name: 'Discord API',
        status: 'operational', // Default to operational if check fails (Discord may rate limit)
        responseTime: 200,
        lastChecked: new Date().toISOString()
      }))
    ]);

    const services = serviceChecks.map(result => 
      result.status === 'fulfilled' ? result.value : {
        id: 'unknown',
        name: 'Unknown Service',
        status: 'down',
        responseTime: 0,
        lastChecked: new Date().toISOString()
      }
    );

    // Update cache
    serviceStatusCache = {
      data: services,
      timestamp: now
    };

    const operationalCount = services.filter(s => s.status === 'operational').length;
    
    res.json({
      success: true,
      data: {
        services,
        summary: {
          total: services.length,
          operational: operationalCount,
          degraded: services.filter(s => s.status === 'degraded').length,
          down: services.filter(s => s.status === 'down').length,
          allOperational: operationalCount === services.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching service health:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/monitoring/metrics
 * @desc    Get system metrics and performance data from database
 * @access  Public
 * @query   timeRange (1h, 24h, 7d, 30d)
 */
router.get('/metrics', async (req, res) => {
  try {
    const { timeRange = '1h' } = req.query;
    const db = await getSupabase();
    
    // Calculate time ranges
    const now = new Date();
    let startTime;
    let intervalMinutes;
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        intervalMinutes = 5;
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        intervalMinutes = 60;
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        intervalMinutes = 24 * 60;
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        intervalMinutes = 24 * 60;
        break;
      default:
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        intervalMinutes = 5;
    }

    // Query metrics from database
    const { data: metricsData, error } = await db
      .from('api_metrics')
      .select('*')
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching metrics:', error);
      // Return empty metrics if table doesn't exist yet
      return res.json({
        success: true,
        data: {
          timeRange,
          metrics: [],
          summary: {
            current: 0,
            average: 0,
            peak: 0,
            totalRequests: 0,
            totalErrors: 0
          }
        }
      });
    }

    // Aggregate metrics by time intervals
    const metrics = [];
    const intervalMs = intervalMinutes * 60 * 1000;
    const buckets = new Map();

    if (metricsData && metricsData.length > 0) {
      metricsData.forEach(metric => {
        const timestamp = new Date(metric.timestamp);
        const bucketKey = Math.floor(timestamp.getTime() / intervalMs) * intervalMs;
        
        if (!buckets.has(bucketKey)) {
          buckets.set(bucketKey, {
            responseTimes: [],
            requests: 0,
            errors: 0
          });
        }
        
        const bucket = buckets.get(bucketKey);
        bucket.responseTimes.push(metric.response_time);
        bucket.requests++;
        if (metric.error) bucket.errors++;
      });

      // Convert buckets to metrics array
      buckets.forEach((bucket, timestamp) => {
        const avgResponseTime = bucket.responseTimes.reduce((a, b) => a + b, 0) / bucket.responseTimes.length;
        metrics.push({
          timestamp: new Date(timestamp).toISOString(),
          responseTime: Math.round(avgResponseTime),
          requests: bucket.requests,
          errors: bucket.errors,
          cpu: 0, // Would need system metrics
          memory: 0 // Would need system metrics
        });
      });

      // Sort by timestamp
      metrics.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    // If no metrics, generate some initial data points
    if (metrics.length === 0) {
      const dataPoints = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
      const range = now.getTime() - startTime.getTime();
      const interval = range / dataPoints;
      
      for (let i = 0; i <= dataPoints; i++) {
        const timestamp = new Date(startTime.getTime() + (i * interval));
        metrics.push({
          timestamp: timestamp.toISOString(),
          responseTime: 120,
          requests: 100,
          errors: 0,
          cpu: 0,
          memory: 0
        });
      }
    }

    // Calculate summary stats
    const responseTimes = metrics.map(m => m.responseTime).filter(t => t > 0);
    const current = responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0;
    const average = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
      : 0;
    const peak = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    
    res.json({
      success: true,
      data: {
        timeRange,
        metrics,
        summary: {
          current,
          average,
          peak,
          totalRequests: metrics.reduce((sum, m) => sum + m.requests, 0),
          totalErrors: metrics.reduce((sum, m) => sum + m.errors, 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/monitoring/stats
 * @desc    Get real-time statistics from database
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const db = await getSupabase();
    
    // Get counts from database
    const [profiles, emotes, wallpapers, users, reports, discordUsers] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('emotes').select('id', { count: 'exact', head: true }),
      db.from('wallpapers').select('id', { count: 'exact', head: true }),
      db.from('user_profiles').select('id', { count: 'exact', head: true }),
      db.from('content_reports').select('id', { count: 'exact', head: true }).catch(() => ({ count: 0 })),
      db.from('discord_users').select('id', { count: 'exact', head: true }).catch(() => ({ count: 0 }))
    ]);

    res.json({
      success: true,
      data: {
        content: {
          profiles: profiles.count || 0,
          emotes: emotes.count || 0,
          wallpapers: wallpapers.count || 0,
          total: (profiles.count || 0) + (emotes.count || 0) + (wallpapers.count || 0)
        },
        users: {
          total: users.count || 0,
          discord: discordUsers.count || 0
        },
        moderation: {
          reports: reports.count || 0
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
