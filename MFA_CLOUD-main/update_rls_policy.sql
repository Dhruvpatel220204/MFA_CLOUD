-- Update RLS Policy for login_attempts table
-- This allows users to view their failed login attempts (which don't have user_id)

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own login attempts" ON public.login_attempts;

-- Create updated policy that allows viewing by user_id OR email match
CREATE POLICY "Users can view own login attempts"
  ON public.login_attempts FOR SELECT
  USING (
    auth.uid() = user_id 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

