-- Fix RLS policy for updating reports
-- The current policy might not be working correctly, so we'll recreate it with better logic

-- Drop the existing policy
DROP POLICY IF EXISTS "Staff can update reports" ON public.reports;

-- Recreate the policy with explicit role check
-- This ensures staff can update reports regardless of the report's current state
CREATE POLICY "Staff can update reports" ON public.reports
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

-- Add a comment explaining the policy
COMMENT ON POLICY "Staff can update reports" ON public.reports IS 
    'Allows staff members (admin, moderator, staff) to update any report. Both USING and WITH CHECK clauses ensure the user has staff role.';

