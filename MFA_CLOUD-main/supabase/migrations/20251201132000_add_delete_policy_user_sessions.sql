-- Add DELETE policy for user_sessions table
-- This allows users to revoke/delete their own device sessions

CREATE POLICY "Users can delete own sessions"
  ON public.user_sessions FOR DELETE
  USING (auth.uid() = user_id);

