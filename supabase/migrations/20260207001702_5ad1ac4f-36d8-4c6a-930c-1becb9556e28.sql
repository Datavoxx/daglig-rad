-- Create table for assistant conversations
CREATE TABLE public.assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own conversations
CREATE POLICY "Users can manage own conversations"
  ON public.assistant_conversations FOR ALL
  USING (auth.uid() = user_id);

-- Index for fast lookup by user
CREATE INDEX idx_assistant_conversations_user_id ON public.assistant_conversations(user_id);

-- Index for sorting by updated_at
CREATE INDEX idx_assistant_conversations_updated ON public.assistant_conversations(updated_at DESC);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_assistant_conversations_updated_at
  BEFORE UPDATE ON public.assistant_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();