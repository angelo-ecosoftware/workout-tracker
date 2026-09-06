-- 1. Delete accidental 'Winkelmandje' and other non-product entries
DELETE FROM public.food_items
WHERE LOWER(TRIM(name)) IN (
  'winkelmandje',
  'winkelmand',
  'inloggen',
  'mijn lijst',
  'gedeelde lijst',
  'shopping list',
  'cart',
  'basket'
);

-- 2. Allow anon and authenticated users to update/upsert community food items (is_custom = false)
DROP POLICY IF EXISTS "Allow update food_items" ON public.food_items;
CREATE POLICY "Allow update food_items" ON public.food_items
  FOR UPDATE
  TO "anon", "authenticated"
  USING (
    (((is_custom = true) AND ((auth.uid())::text = user_id)) OR
     (is_custom = false) OR
     EXISTS (
       SELECT 1 FROM public.user_roles ur
       WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
     ))
  )
  WITH CHECK (
    (((is_custom = true) AND ((auth.uid())::text = user_id)) OR
     (is_custom = false) OR
     EXISTS (
       SELECT 1 FROM public.user_roles ur
       WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
     ))
  );

-- 3. Ensure INSERT policy on food_items permits community food items
DROP POLICY IF EXISTS "Allow insert food_items" ON public.food_items;
CREATE POLICY "Allow insert food_items" ON public.food_items
  FOR INSERT
  TO "anon", "authenticated"
  WITH CHECK (
    (((is_custom = true) AND ((auth.uid())::text = user_id)) OR
     (is_custom = false) OR
     EXISTS (
       SELECT 1 FROM public.user_roles ur
       WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
     ))
  );
