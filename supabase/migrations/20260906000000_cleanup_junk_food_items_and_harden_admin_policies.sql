-- 1. Purge all junk/placeholder food items named 'Product', 'Unknown Product', 'AH Product', etc.
DELETE FROM public.food_items
WHERE LOWER(TRIM(name)) IN (
  'product',
  'unknown',
  'unknown product',
  'null',
  'undefined',
  'ah product',
  'jumbo product',
  'dirk product',
  'plus product',
  'albert heijn product'
)
OR name IS NULL
OR TRIM(name) = '';

-- 2. Allow Admins full delete and update access on the global catalog (food_items)
DROP POLICY IF EXISTS "Allow delete own food_items" ON public.food_items;
CREATE POLICY "Allow delete food_items"
  ON public.food_items
  FOR DELETE
  TO authenticated
  USING (
    (is_custom = true AND auth.uid()::text = user_id::text)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow update own food_items" ON public.food_items;
CREATE POLICY "Allow update food_items"
  ON public.food_items
  FOR UPDATE
  TO authenticated
  USING (
    (is_custom = true AND auth.uid()::text = user_id::text)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    (is_custom = true AND auth.uid()::text = user_id::text)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
