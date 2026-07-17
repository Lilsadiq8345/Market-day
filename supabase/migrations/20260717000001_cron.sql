-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the pg_net extension to make HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a scheduled job to run every day at 8:00 AM UTC
-- This will trigger our Supabase Edge Function to send email reminders
SELECT cron.schedule(
  'daily-market-reminders',
  '0 8 * * *', -- Run every day at 08:00
  $$
  SELECT net.http_post(
      url:='https://slvgrifmpyfwaewzeawn.supabase.co/functions/v1/rapid-responder',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdmdyaWZtcHlmd2Fld3plYXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDk3NzIsImV4cCI6MjA5OTg4NTc3Mn0.IGmOHHbMYZCl0GzgqQzK3jE_Ut7u0T_38F4zUpusZYY"}'::jsonb
  ) as request_id;
  $$
);
