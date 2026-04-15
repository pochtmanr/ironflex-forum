-- Atomic view-count increment for topics. Replaces the read-modify-write
-- pattern in src/app/api/forum/topics/[topicId]/route.ts which races under
-- concurrent load.

CREATE OR REPLACE FUNCTION public.increment_topic_views(p_topic_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE topics SET views = COALESCE(views, 0) + 1 WHERE id = p_topic_id;
$$;

REVOKE ALL ON FUNCTION public.increment_topic_views(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_topic_views(uuid) TO service_role;
