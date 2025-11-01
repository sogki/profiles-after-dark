import { getSupabase } from '../../utils/supabase.js';

/**
 * Middleware to track API metrics
 * Tracks all API requests and stores them in the database for monitoring
 */
export async function trackMetric(req, res, next) {
  // Skip tracking for health checks and metrics endpoints to avoid recursion
  if (req.path === '/health' || req.path.includes('/monitoring/')) {
    return next();
  }

  const startTime = Date.now();
  const originalSend = res.send;
  
  // Track response size
  let responseSize = 0;
  
  res.send = function(data) {
    try {
      if (data && typeof data === 'string') {
        responseSize = Buffer.byteLength(data, 'utf8');
      } else if (data) {
        responseSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
      }
    } catch (err) {
      // Ignore errors calculating response size
    }
    return originalSend.call(this, data);
  };

  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - startTime;
      const db = await getSupabase();
      
      if (db) {
        // Don't await - fire and forget to avoid blocking the response
        db.from('api_metrics').insert({
          endpoint: req.path,
          method: req.method,
          response_time: responseTime,
          status_code: res.statusCode,
          error: res.statusCode >= 400,
          error_message: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null,
          request_size: req.get('content-length') ? parseInt(req.get('content-length'), 10) : null,
          response_size: responseSize,
          user_agent: req.get('user-agent'),
          ip_address: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
          timestamp: new Date().toISOString()
        }).catch((error) => {
          // Silently fail metrics tracking to not interrupt requests
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to track metric:', error.message);
          }
        });
      }
    } catch (error) {
      // Silently fail metrics tracking to not interrupt requests
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to track metric:', error.message);
      }
    }
  });

  next();
}

