
-- Fix login_attempts SELECT policy to allow users to see their failed attempts (which have no user_id)
DROP POLICY IF EXISTS "Users can view own login attempts" ON public.login_attempts;

CREATE POLICY "Users can view own login attempts"
  ON public.login_attempts FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow admins to view ALL login attempts
CREATE POLICY "Admins can view all login attempts"
  ON public.login_attempts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
