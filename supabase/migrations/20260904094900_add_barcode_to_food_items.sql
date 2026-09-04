-- Add barcode column to food_items
ALTER TABLE "public"."food_items" 
ADD COLUMN IF NOT EXISTS "barcode" text;

CREATE INDEX IF NOT EXISTS "idx_food_items_barcode" 
ON "public"."food_items" USING btree ("barcode");

-- Update RLS policies to allow anon and authenticated users to auto-insert & update shared community food items
DROP POLICY IF EXISTS "Allow insert food_items" ON "public"."food_items";
CREATE POLICY "Allow insert food_items" ON "public"."food_items"
  FOR INSERT
  TO "anon", "authenticated"
  WITH CHECK (
    (((is_custom = true) AND ((auth.uid())::text = user_id)) OR
     ((is_custom = false) AND ((user_id IS NULL) OR (user_id = 'community'::text) OR ((auth.uid())::text = user_id))))
  );

DROP POLICY IF EXISTS "Allow update own food_items" ON "public"."food_items";
CREATE POLICY "Allow update own food_items" ON "public"."food_items"
  FOR UPDATE
  TO "anon", "authenticated"
  USING (
    (((is_custom = true) AND ((auth.uid())::text = user_id)) OR
     (is_custom = false))
  )
  WITH CHECK (
    (((is_custom = true) AND ((auth.uid())::text = user_id)) OR
     (is_custom = false))
  );
