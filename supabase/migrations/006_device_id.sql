-- Add device_id column to users table
-- Each user can only login from one device (except admin)

ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);

