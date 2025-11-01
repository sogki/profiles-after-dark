-- Service Status Table
-- Stores service health checks and status information

CREATE TABLE IF NOT EXISTS public.service_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'down')),
    response_time INTEGER, -- in milliseconds
    status_code INTEGER,
    error_message TEXT,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked_by TEXT DEFAULT 'system',
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_status_service_id ON public.service_status(service_id);
CREATE INDEX IF NOT EXISTS idx_service_status_last_checked ON public.service_status(last_checked DESC);
CREATE INDEX IF NOT EXISTS idx_service_status_status ON public.service_status(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_status_latest ON public.service_status(service_id, last_checked DESC);

-- Enable Row Level Security
ALTER TABLE public.service_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Service role can manage service status" ON public.service_status;

-- RLS Policy for service_status
CREATE POLICY "Service role can manage service status" ON public.service_status
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to get latest service status
CREATE OR REPLACE FUNCTION get_latest_service_status()
RETURNS TABLE (
    service_id TEXT,
    service_name TEXT,
    status TEXT,
    response_time INTEGER,
    last_checked TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (ss.service_id)
        ss.service_id,
        ss.service_name,
        ss.status,
        ss.response_time,
        ss.last_checked
    FROM public.service_status ss
    ORDER BY ss.service_id, ss.last_checked DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.service_status IS 'Stores service health check results';
COMMENT ON COLUMN public.service_status.service_id IS 'Unique identifier for the service (e.g., website, api, database)';

