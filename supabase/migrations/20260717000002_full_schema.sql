-- 1. Create Villages table
CREATE TABLE villages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  lga TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Drop the old subscribers table (as warned in the plan)
DROP TABLE IF EXISTS subscribers CASCADE;

-- 3. Modify Markets table
-- We need to add village_id and start_time
-- But we can't just add a NOT NULL column if there's existing data without a default, 
-- or we can truncate the markets table if we want a clean slate. Let's add them as nullable first,
-- or just drop and recreate markets for a clean slate since it's a test project.
-- We will DROP and recreate markets to ensure clean schema matching exactly.
DROP TABLE IF EXISTS markets CASCADE;

CREATE TABLE markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL DEFAULT '08:00:00',
  location TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  village_id UUID REFERENCES villages(id) ON DELETE SET NULL,
  preferred_channel TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  reminder_offset_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, market_id)
);

-- 6. Create Reminder Logs table
CREATE TABLE reminder_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- Villages Policies
CREATE POLICY "Anyone can read villages." ON villages FOR SELECT USING (true);
CREATE POLICY "Authenticated admins can manage villages." ON villages FOR ALL TO authenticated USING (true);

-- Markets Policies
CREATE POLICY "Anyone can read markets." ON markets FOR SELECT USING (true);
CREATE POLICY "Authenticated admins can manage markets." ON markets FOR ALL TO authenticated USING (true);

-- Users Policies
CREATE POLICY "Anyone can read users (for login/subscribe)." ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users." ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated admins can manage users." ON users FOR ALL TO authenticated USING (true);

-- Subscriptions Policies
CREATE POLICY "Anyone can read subscriptions." ON subscriptions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert subscriptions." ON subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated admins can manage subscriptions." ON subscriptions FOR ALL TO authenticated USING (true);

-- Reminder Logs Policies
CREATE POLICY "Authenticated admins can read logs." ON reminder_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert logs (for edge function)." ON reminder_logs FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_markets_village_id ON markets(village_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_market_id ON subscriptions(market_id);
CREATE INDEX idx_reminder_logs_sent_at ON reminder_logs(sent_at);
