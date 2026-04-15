-- Drop the SECURITY DEFINER exec_sql RPC; it's a footgun and migrations
-- should run via psql/CLI not via DB-resident functions.
DROP FUNCTION IF EXISTS public.exec_sql(text);
