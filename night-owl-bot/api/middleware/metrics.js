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
        // Extract user ID if authenticated
        const userId = req.user?.id || req.user?.user_id || null;
        
        // Extract API version from path (e.g., /api/v1/...)
        const apiVersionMatch = req.path.match(/\/api\/(v\d+)/);
        const apiVersion = apiVersionMatch ? apiVersionMatch[1] : null;
        
        // Extract query parameters
        const queryParams = Object.keys(req.query).length > 0 ? req.query : null;
        
        // Extract relevant request headers
        const requestHeaders = {
          'content-type': req.get('content-type'),
          'accept': req.get('accept'),
          'authorization': req.get('authorization') ? '***' : null, // Mask auth token
          'referer': req.get('referer'),
          'origin': req.get('origin'),
        };
        
        // Extract relevant response headers
        const responseHeaders = {
          'content-type': res.get('content-type'),
          'cache-control': res.get('cache-control'),
          'x-cache': res.get('x-cache'),
        };
        
        // Determine cache hit status
        const cacheHit = res.get('x-cache') === 'HIT' || res.get('cf-cache-status') === 'HIT';
        
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
          ip_address: req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
          user_id: userId,
          query_params: queryParams,
          request_headers: requestHeaders,
          response_headers: responseHeaders,
          cache_hit: cacheHit,
          api_version: apiVersion,
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

