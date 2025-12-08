-- Complete Database Setup Script
-- Run this in Supabase SQL Editor to create all tables and policies

-- =====================================================
-- STEP 1: Create login_attempts table (if it doesn't exist)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Update RLS Policy to allow viewing by email
-- =====================================================
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view own login attempts" ON public.login_attempts;

-- Create updated policy that allows viewing by user_id OR email match
CREATE POLICY "Users can view own login attempts"
  ON public.login_attempts FOR SELECT
  USING (
    auth.uid() = user_id 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Ensure insert policy exists (for login tracking)
DROP POLICY IF EXISTS "Service role can insert login attempts" ON public.login_attempts;

CREATE POLICY "Service role can insert login attempts"
  ON public.login_attempts FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Verification Query (optional - to check if setup worked)
-- =====================================================
-- SELECT * FROM public.login_attempts LIMIT 1;

