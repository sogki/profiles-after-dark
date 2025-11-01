-- Add function to increment download count for any table
-- This migration adds a generic function to increment download counts

CREATE OR REPLACE FUNCTION increment_download_count(table_name text, record_id uuid)
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE %I SET download_count = COALESCE(download_count, 0) + 1 WHERE id = $1', table_name)
    USING record_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_download_count(text, uuid) TO authenticated;

