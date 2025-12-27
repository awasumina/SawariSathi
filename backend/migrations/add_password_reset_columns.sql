-- Migration: Add password reset columns to users table
-- Run this SQL in your Supabase SQL Editor to enable forgot password functionality

-- Add columns for password reset OTP
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_attempts INTEGER DEFAULT 0;

-- Create index for faster lookups during password reset
CREATE INDEX IF NOT EXISTS idx_users_reset_otp ON users(reset_otp) WHERE reset_otp IS NOT NULL;

-- Optional: Add comment for documentation
COMMENT ON COLUMN users.reset_otp IS 'OTP code for password reset';
COMMENT ON COLUMN users.reset_otp_expires IS 'Expiration timestamp for password reset OTP';
COMMENT ON COLUMN users.reset_attempts IS 'Number of failed password reset attempts';
