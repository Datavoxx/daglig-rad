-- Create ai_feedback table for storing user feedback on AI assistant tasks
CREATE TABLE public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.assistant_conversations(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add validation trigger instead of CHECK constraint for rating
CREATE OR REPLACE FUNCTION public.validate_ai_feedback_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_ai_feedback_rating_trigger
BEFORE INSERT OR UPDATE ON public.ai_feedback
FOR EACH ROW
EXECUTE FUNCTION public.validate_ai_feedback_rating();

-- Enable RLS
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert own feedback"
  ON public.ai_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON public.ai_feedback FOR SELECT
  USING (auth.uid() = user_id);