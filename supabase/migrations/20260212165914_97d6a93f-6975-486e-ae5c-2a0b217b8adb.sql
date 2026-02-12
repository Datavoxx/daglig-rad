
ALTER TABLE public.ai_usage_logs
  ADD COLUMN tokens_in integer,
  ADD COLUMN tokens_out integer,
  ADD COLUMN cost_estimate numeric,
  ADD COLUMN response_time_ms integer,
  ADD COLUMN input_size integer,
  ADD COLUMN output_size integer;
