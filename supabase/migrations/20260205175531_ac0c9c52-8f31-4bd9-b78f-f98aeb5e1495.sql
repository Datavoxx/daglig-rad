-- Create training_bookings table to store all training requests
CREATE TABLE public.training_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  training_duration TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  webhook_status TEXT DEFAULT 'pending',
  webhook_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public booking form)
CREATE POLICY "Anyone can submit training booking"
ON public.training_bookings
FOR INSERT
WITH CHECK (true);

-- Only admins can view bookings
CREATE POLICY "Admins can view training bookings"
ON public.training_bookings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));