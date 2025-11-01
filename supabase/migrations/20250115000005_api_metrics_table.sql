-- API Metrics Storage Table
-- Stores metrics for monitoring and analytics

CREATE TABLE IF NOT EXISTS public.api_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint TEXT NOT NULL,
    method TEXT DEFAULT 'GET',
    response_time INTEGER NOT NULL, -- in milliseconds
    status_code INTEGER DEFAULT 200,
    error BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    request_size INTEGER,
    response_size INTEGER,
    user_agent TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_api_metrics_timestamp ON public.api_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON public.api_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_metrics_status_code ON public.api_metrics(status_code);
CREATE INDEX IF NOT EXISTS idx_api_metrics_error ON public.api_metrics(error);
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint_timestamp ON public.api_metrics(endpoint, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.api_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Service role can manage API metrics" ON public.api_metrics;

-- RLS Policy for api_metrics
CREATE POLICY "Service role can manage API metrics" ON public.api_metrics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to get aggregated metrics
-- Note: This uses date_trunc for time bucketing (built-in PostgreSQL function)
CREATE OR REPLACE FUNCTION get_api_metrics_summary(
    p_time_range TEXT DEFAULT '1h',
    p_endpoint TEXT DEFAULT NULL
)
RETURNS TABLE (
    time_bucket TIMESTAMP WITH TIME ZONE,
    avg_response_time NUMERIC,
    total_requests BIGINT,
    total_errors BIGINT,
    p95_response_time NUMERIC,
    p99_response_time NUMERIC
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
        COUNT(*)::BIGINT AS total_requests,
        SUM(CASE WHEN error THEN 1 ELSE 0 END)::BIGINT AS total_errors,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) AS p95_response_time,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time) AS p99_response_time
    FROM public.api_metrics
    WHERE timestamp >= v_start_time
        AND (p_endpoint IS NULL OR endpoint = p_endpoint)
    GROUP BY date_trunc(v_interval, timestamp)
    ORDER BY time_bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON TABLE public.api_metrics IS 'Stores API request metrics for monitoring and analytics';
COMMENT ON COLUMN public.api_metrics.response_time IS 'Response time in milliseconds';
COMMENT ON COLUMN public.api_metrics.timestamp IS 'When the request was made';

