-- Create Markets table
CREATE TABLE markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  location TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Subscribers table
CREATE TABLE subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(email, market_id) -- A user can only subscribe once per market
);

-- Enable Row Level Security (RLS)
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Markets Policies
-- Anyone can read markets
CREATE POLICY "Public profiles are viewable by everyone." 
ON markets FOR SELECT 
USING ( true );

-- Only authenticated users (admins) can insert/update/delete markets
CREATE POLICY "Authenticated users can create markets." 
ON markets FOR INSERT 
TO authenticated 
WITH CHECK ( true );

CREATE POLICY "Authenticated users can update markets." 
ON markets FOR UPDATE 
TO authenticated 
USING ( true );

CREATE POLICY "Authenticated users can delete markets." 
ON markets FOR DELETE 
TO authenticated 
USING ( true );

-- Subscribers Policies
-- Anyone can create a subscription
CREATE POLICY "Anyone can subscribe." 
ON subscribers FOR INSERT 
WITH CHECK ( true );

-- Only authenticated users (admins) can read or delete subscribers
CREATE POLICY "Authenticated users can read subscribers." 
ON subscribers FOR SELECT 
TO authenticated 
USING ( true );

CREATE POLICY "Authenticated users can delete subscribers." 
ON subscribers FOR DELETE 
TO authenticated 
USING ( true );

-- Create an index for faster lookups
CREATE INDEX idx_subscribers_market_id ON subscribers(market_id);
