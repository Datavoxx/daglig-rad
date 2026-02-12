
-- Create ai_usage_logs table
CREATE TABLE public.ai_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  model text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admin can read all logs
CREATE POLICY "Admins can view all ai usage logs"
ON public.ai_usage_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can read their own logs
CREATE POLICY "Users can view own ai usage logs"
ON public.ai_usage_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Service role inserts (no RLS restriction needed, service_role bypasses RLS)
-- But allow authenticated insert for safety
CREATE POLICY "Service role can insert ai usage logs"
ON public.ai_usage_logs
FOR INSERT
WITH CHECK (true);
