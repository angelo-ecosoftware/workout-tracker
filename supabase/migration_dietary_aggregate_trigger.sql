-- ==============================================================================
-- Workout Tracker Database Hardening: Automated Macro Sync Trigger
-- Automatically recomputes dietary_logs totals whenever dietary_log_entries changes
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sync_dietary_log_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_log_id TEXT;
  target_user_id TEXT;
  target_date DATE;
  agg_kcal NUMERIC(7, 2);
  agg_protein NUMERIC(7, 2);
  agg_carbs NUMERIC(7, 2);
  agg_sugar NUMERIC(7, 2);
  agg_fat NUMERIC(7, 2);
  agg_fiber NUMERIC(7, 2);
  entry_count INT;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_log_id := OLD.dietary_log_id;
    target_user_id := OLD.user_id;
  ELSE
    target_log_id := NEW.dietary_log_id;
    target_user_id := NEW.user_id;
  END IF;

  IF target_log_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Count remaining entries for this log
  SELECT COUNT(*),
         COALESCE(SUM(calculated_kcal), 0),
         COALESCE(SUM(calculated_protein), 0),
         COALESCE(SUM(calculated_carbs), 0),
         COALESCE(SUM(calculated_sugar), 0),
         COALESCE(SUM(calculated_fat), 0),
         COALESCE(SUM(calculated_fiber), 0)
  INTO entry_count, agg_kcal, agg_protein, agg_carbs, agg_sugar, agg_fat, agg_fiber
  FROM public.dietary_log_entries
  WHERE dietary_log_id = target_log_id;

  -- If 0 entries remain, clean up the parent summary log row
  IF entry_count = 0 THEN
    DELETE FROM public.dietary_logs WHERE id = target_log_id;
  ELSE
    UPDATE public.dietary_logs
    SET total_kcal = agg_kcal,
        total_protein = agg_protein,
        total_carbs = agg_carbs,
        total_sugar = agg_sugar,
        total_fat = agg_fat,
        total_fiber = agg_fiber,
        updated_at = NOW()
    WHERE id = target_log_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on dietary_log_entries
DROP TRIGGER IF EXISTS trigger_sync_dietary_log_totals ON public.dietary_log_entries;
CREATE TRIGGER trigger_sync_dietary_log_totals
AFTER INSERT OR UPDATE OR DELETE ON public.dietary_log_entries
FOR EACH ROW
EXECUTE FUNCTION public.sync_dietary_log_totals();
