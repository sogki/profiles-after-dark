-- Add staff permissions system
-- This allows admins to control what staff members can access

-- Create staff_permissions table
CREATE TABLE IF NOT EXISTS public.staff_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    permission_key TEXT NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, permission_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_permissions_user_id ON public.staff_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_permission_key ON public.staff_permissions(permission_key);

-- Enable RLS
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Staff can view their own permissions
CREATE POLICY "Staff can view their own permissions" ON public.staff_permissions
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Only admins can manage permissions
CREATE POLICY "Admins can manage permissions" ON public.staff_permissions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Add comment
COMMENT ON TABLE public.staff_permissions IS 'Stores granular permissions for staff members, controlled by admins';

