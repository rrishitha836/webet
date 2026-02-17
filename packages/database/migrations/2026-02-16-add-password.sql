-- Add password_hash column for admin password authentication (PoC)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash text;

-- Optionally, ensure existing admin accounts are assigned a password via manual SQL or an admin tool.
