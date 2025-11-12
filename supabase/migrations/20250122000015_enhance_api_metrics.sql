-- Enhance API Metrics Table
-- Adds additional fields and indexes for comprehensive API tracking

-- Add additional columns if they don't exist
DO $$
BEGIN
    -- Add user_id for authenticated requests
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'api_metrics'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.api_metrics
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Add query parameters for endpoint usage statistics
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'api_metrics'
        AND column_name = 'query_params'
    ) THEN
        ALTER TABLE public.api_metrics
        ADD COLUMN query_params JSONB;
    END IF;

    -- Add request headers for better tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'api_metrics'
        AND column_name = 'request_headers'
    ) THEN
        ALTER TABLE public.api_metrics
        ADD COLUMN request_headers JSONB;
    END IF;

    -- Add response headers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'api_metrics'
        AND column_name = 'response_headers'
    ) THEN
        ALTER TABLE public.api_metrics
        ADD COLUMN response_headers JSONB;
    END IF;

    -- Add cache status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'api_metrics'
        AND column_name = 'cache_hit'
    ) THEN
        ALTER TABLE public.api_metrics
        ADD COLUMN cache_hit BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add API version
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'api_metrics'
        AND column_name = 'api_version'
    ) THEN
        ALTER TABLE public.api_metrics
        ADD COLUMN api_version TEXT;
    END IF;
END $$;

-- Create additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_api_metrics_user_id ON public.api_metrics(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_metrics_method ON public.api_metrics(method);
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint_method ON public.api_metrics(endpoint, method);
CREATE INDEX IF NOT EXISTS idx_api_metrics_status_code_timestamp ON public.api_metrics(status_code, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_error_timestamp ON public.api_metrics(error, timestamp DESC) WHERE error = TRUE;
CREATE INDEX IF NOT EXISTS idx_api_metrics_ip_address ON public.api_metrics(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_metrics_cache_hit ON public.api_metrics(cache_hit) WHERE cache_hit = TRUE;

-- Create GIN index for JSONB columns (query_params, request_headers)
CREATE INDEX IF NOT EXISTS idx_api_metrics_query_params ON public.api_metrics USING GIN(query_params) WHERE query_params IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_metrics_request_headers ON public.api_metrics USING GIN(request_headers) WHERE request_headers IS NOT NULL;

-- Create composite index for endpoint usage statistics
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint_usage ON public.api_metrics(endpoint, method, status_code, timestamp DESC);

-- Drop existing function first to allow return type change
DROP FUNCTION IF EXISTS get_api_metrics_summary(TEXT, TEXT);

-- Enhanced function to get comprehensive metrics summary
CREATE OR REPLACE FUNCTION get_api_metrics_summary(
    p_time_range TEXT DEFAULT '1h',
    p_endpoint TEXT DEFAULT NULL
)
RETURNS TABLE (
    time_bucket TIMESTAMP WITH TIME ZONE,
    avg_response_time NUMERIC,
    min_response_time NUMERIC,
    max_response_time NUMERIC,
    total_requests BIGINT,
    total_errors BIGINT,
    error_rate NUMERIC,
    p50_response_time NUMERIC,
    p95_response_time NUMERIC,
    p99_response_time NUMERIC,
    avg_request_size NUMERIC,
    avg_response_size NUMERIC,
    total_request_size BIGINT,
    total_response_size BIGINT,
    unique_ips BIGINT,
    unique_user_agents BIGINT,
    cache_hit_rate NUMERIC
) AS $$
DECLARE
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_interval TEXT;
BEGIN
    -- Calculate start time and interval based on range
    CASE p_time_range
        WHEN '1h' THEN 
            v_start_time := NOW() - INTERVAL '1 hour';
            v_interval := '5 minutes';
        WHEN '24h' THEN
            v_start_time := NOW() - INTERVAL '24 hours';
            v_interval := '1 hour';
        WHEN '7d' THEN
            v_start_time := NOW() - INTERVAL '7 days';
            v_interval := '1 day';
        WHEN '30d' THEN
            v_start_time := NOW() - INTERVAL '30 days';
            v_interval := '1 day';
        ELSE
            v_start_time := NOW() - INTERVAL '1 hour';
            v_interval := '5 minutes';
    END CASE;

    RETURN QUERY
    SELECT 
        date_trunc(v_interval, timestamp) AS time_bucket,
        AVG(response_time::NUMERIC) AS avg_response_time,
        MIN(response_time::NUMERIC) AS min_response_time,
        MAX(response_time::NUMERIC) AS max_response_time,
        COUNT(*)::BIGINT AS total_requests,
        SUM(CASE WHEN error THEN 1 ELSE 0 END)::BIGINT AS total_errors,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (SUM(CASE WHEN error THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC * 100)
            ELSE 0
        END AS error_rate,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY response_time) AS p50_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) AS p95_response_time,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time) AS p99_response_time,
        AVG(request_size::NUMERIC) AS avg_request_size,
        AVG(response_size::NUMERIC) AS avg_response_size,
        SUM(request_size)::BIGINT AS total_request_size,
        SUM(response_size)::BIGINT AS total_response_size,
        COUNT(DISTINCT ip_address)::BIGINT AS unique_ips,
        COUNT(DISTINCT user_agent)::BIGINT AS unique_user_agents,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC * 100)
            ELSE 0
        END AS cache_hit_rate
    FROM public.api_metrics
    WHERE timestamp >= v_start_time
        AND (p_endpoint IS NULL OR endpoint = p_endpoint)
    GROUP BY date_trunc(v_interval, timestamp)
    ORDER BY time_bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get endpoint usage statistics
CREATE OR REPLACE FUNCTION get_endpoint_usage_stats(
    p_time_range TEXT DEFAULT '24h',
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    endpoint TEXT,
    method TEXT,
    total_requests BIGINT,
    total_errors BIGINT,
    error_rate NUMERIC,
    avg_response_time NUMERIC,
    p95_response_time NUMERIC,
    total_request_size BIGINT,
    total_response_size BIGINT,
    unique_ips BIGINT,
    unique_users BIGINT
) AS $$
DECLARE
    v_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate start time based on range
    CASE p_time_range
        WHEN '1h' THEN 
            v_start_time := NOW() - INTERVAL '1 hour';
        WHEN '24h' THEN
            v_start_time := NOW() - INTERVAL '24 hours';
        WHEN '7d' THEN
            v_start_time := NOW() - INTERVAL '7 days';
        WHEN '30d' THEN
            v_start_time := NOW() - INTERVAL '30 days';
        ELSE
            v_start_time := NOW() - INTERVAL '24 hours';
    END CASE;

    RETURN QUERY
    SELECT 
        m.endpoint,
        m.method,
        COUNT(*)::BIGINT AS total_requests,
        SUM(CASE WHEN m.error THEN 1 ELSE 0 END)::BIGINT AS total_errors,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (SUM(CASE WHEN m.error THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC * 100)
            ELSE 0
        END AS error_rate,
        AVG(m.response_time::NUMERIC) AS avg_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY m.response_time) AS p95_response_time,
        SUM(m.request_size)::BIGINT AS total_request_size,
        SUM(m.response_size)::BIGINT AS total_response_size,
        COUNT(DISTINCT m.ip_address)::BIGINT AS unique_ips,
        COUNT(DISTINCT m.user_id)::BIGINT AS unique_users
    FROM public.api_metrics m
    WHERE m.timestamp >= v_start_time
    GROUP BY m.endpoint, m.method
    ORDER BY total_requests DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get error statistics by status code
CREATE OR REPLACE FUNCTION get_error_statistics(
    p_time_range TEXT DEFAULT '24h'
)
RETURNS TABLE (
    status_code INTEGER,
    error_count BIGINT,
    percentage NUMERIC,
    avg_response_time NUMERIC,
    endpoints TEXT[]
) AS $$
DECLARE
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_total_errors BIGINT;
BEGIN
    -- Calculate start time based on range
    CASE p_time_range
        WHEN '1h' THEN 
            v_start_time := NOW() - INTERVAL '1 hour';
        WHEN '24h' THEN
            v_start_time := NOW() - INTERVAL '24 hours';
        WHEN '7d' THEN
            v_start_time := NOW() - INTERVAL '7 days';
        WHEN '30d' THEN
            v_start_time := NOW() - INTERVAL '30 days';
        ELSE
            v_start_time := NOW() - INTERVAL '24 hours';
    END CASE;

    -- Get total errors
    SELECT COUNT(*) INTO v_total_errors
    FROM public.api_metrics
    WHERE timestamp >= v_start_time AND error = TRUE;

    RETURN QUERY
    SELECT 
        m.status_code,
        COUNT(*)::BIGINT AS error_count,
        CASE 
            WHEN v_total_errors > 0 THEN 
                (COUNT(*)::NUMERIC / v_total_errors::NUMERIC * 100)
            ELSE 0
        END AS percentage,
        AVG(m.response_time::NUMERIC) AS avg_response_time,
        ARRAY_AGG(DISTINCT m.endpoint) AS endpoints
    FROM public.api_metrics m
    WHERE m.timestamp >= v_start_time AND m.error = TRUE
    GROUP BY m.status_code
    ORDER BY error_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comments
COMMENT ON COLUMN public.api_metrics.response_time IS 'Response time in milliseconds';
COMMENT ON COLUMN public.api_metrics.request_size IS 'Request body size in bytes';
COMMENT ON COLUMN public.api_metrics.response_size IS 'Response body size in bytes';
COMMENT ON COLUMN public.api_metrics.status_code IS 'HTTP status code (200, 404, 500, etc.)';
COMMENT ON COLUMN public.api_metrics.error IS 'Whether the request resulted in an error (status >= 400)';
COMMENT ON COLUMN public.api_metrics.user_agent IS 'Client user agent string';
COMMENT ON COLUMN public.api_metrics.ip_address IS 'Client IP address';
COMMENT ON COLUMN public.api_metrics.user_id IS 'Authenticated user ID (if applicable)';
COMMENT ON COLUMN public.api_metrics.query_params IS 'Query parameters as JSON object';
COMMENT ON COLUMN public.api_metrics.request_headers IS 'Request headers as JSON object';
COMMENT ON COLUMN public.api_metrics.response_headers IS 'Response headers as JSON object';
COMMENT ON COLUMN public.api_metrics.cache_hit IS 'Whether the response was served from cache';
COMMENT ON COLUMN public.api_metrics.api_version IS 'API version (e.g., v1, v2)';

