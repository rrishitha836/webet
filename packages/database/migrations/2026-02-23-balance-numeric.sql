-- Fix: balance column must be numeric to support fractional LMSR costs
-- The LMSR engine produces costs like 5.1249... which cannot be stored in an integer column
ALTER TABLE users ALTER COLUMN balance TYPE NUMERIC(18,4) USING balance::numeric;
