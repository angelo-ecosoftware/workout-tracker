COMMENT ON SCHEMA "public" IS NULL;

GRANT ALL ON SCHEMA "public" TO "postgres";
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";
GRANT ALL ON SCHEMA "public" TO "service_role";

CREATE TABLE "public"."body_logs" (
  "id"                  text                     NOT NULL,
  "user_id"             text                     NOT NULL,
  "log_date"            date                     NOT NULL,
  "weight_kg"           numeric(5,2)             NOT NULL,
  "height_cm"           numeric(5,2),
  "calculated_bmi"      numeric(4,1),
  "waist_cm"            numeric(5,2),
  "body_fat_percentage" numeric(4,1),
  "notes"               text,
  "source"              text                     DEFAULT 'profile'::text,
  "created_at"          timestamp with time zone DEFAULT now(),
  "updated_at"          timestamp with time zone DEFAULT now(),
  CONSTRAINT "body_logs_pkey" PRIMARY KEY (id),
  CONSTRAINT "body_logs_user_date_unique" UNIQUE (user_id, log_date)
);

ALTER TABLE "public"."body_logs"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."body_logs"
  FORCE ROW LEVEL SECURITY;

CREATE TABLE "public"."dietary_log_entries" (
  "id"                 text                     NOT NULL,
  "dietary_log_id"     text,
  "user_id"            text                     NOT NULL,
  "food_item_id"       text,
  "name"               text                     NOT NULL,
  "brand"              text,
  "amount_grams"       numeric(7,2)             NOT NULL,
  "kcal_per_100g"      numeric(7,2)             DEFAULT 0,
  "protein_per_100g"   numeric(7,2)             DEFAULT 0,
  "carbs_per_100g"     numeric(7,2)             DEFAULT 0,
  "sugar_per_100g"     numeric(7,2)             DEFAULT 0,
  "fat_per_100g"       numeric(7,2)             DEFAULT 0,
  "fiber_per_100g"     numeric(7,2)             DEFAULT 0,
  "calculated_kcal"    numeric(7,2)             DEFAULT 0,
  "calculated_protein" numeric(7,2)             DEFAULT 0,
  "calculated_carbs"   numeric(7,2)             DEFAULT 0,
  "calculated_sugar"   numeric(7,2)             DEFAULT 0,
  "calculated_fat"     numeric(7,2)             DEFAULT 0,
  "calculated_fiber"   numeric(7,2)             DEFAULT 0,
  "logged_at"          timestamp with time zone DEFAULT now(),
  "created_at"         timestamp with time zone DEFAULT now(),
  CONSTRAINT "dietary_log_entries_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."dietary_log_entries"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."dietary_log_entries"
  FORCE ROW LEVEL SECURITY;

CREATE TABLE "public"."dietary_logs" (
  "id"            text                     NOT NULL,
  "user_id"       text                     NOT NULL,
  "log_date"      date                     NOT NULL,
  "total_kcal"    numeric(7,2)             DEFAULT 0,
  "total_protein" numeric(7,2)             DEFAULT 0,
  "total_carbs"   numeric(7,2)             DEFAULT 0,
  "total_sugar"   numeric(7,2)             DEFAULT 0,
  "total_fat"     numeric(7,2)             DEFAULT 0,
  "total_fiber"   numeric(7,2)             DEFAULT 0,
  "entries_json"  jsonb                    DEFAULT '[]'::jsonb,
  "created_at"    timestamp with time zone DEFAULT now(),
  "updated_at"    timestamp with time zone DEFAULT now(),
  CONSTRAINT "dietary_logs_pkey" PRIMARY KEY (id),
  CONSTRAINT "unique_user_diet_date" UNIQUE (user_id, log_date)
);

ALTER TABLE "public"."dietary_logs"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."dietary_logs"
  FORCE ROW LEVEL SECURITY;

CREATE TABLE "public"."exercises" (
  "id"             text                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        text                     NOT NULL,
  "name"           text                     NOT NULL,
  "type"           text                     NOT NULL DEFAULT 'strength'::text,
  "target_sets"    integer                  NOT NULL DEFAULT 3,
  "target_rep_min" integer                  NOT NULL DEFAULT 8,
  "target_rep_max" integer                  NOT NULL DEFAULT 12,
  "created_at"     timestamp with time zone DEFAULT now(),
  "is_custom"      boolean                  DEFAULT false,
  CONSTRAINT "exercises_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."exercises"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."exercises"
  FORCE ROW LEVEL SECURITY;

CREATE TABLE "public"."food_items" (
  "id"                   text                     NOT NULL,
  "name"                 text                     NOT NULL,
  "brand"                text,
  "serving_unit"         text                     DEFAULT 'gram'::text,
  "kcal_per_100g"        numeric(7,2)             DEFAULT 0,
  "protein_per_100g"     numeric(7,2)             DEFAULT 0,
  "carbs_per_100g"       numeric(7,2)             DEFAULT 0,
  "sugar_per_100g"       numeric(7,2)             DEFAULT 0,
  "fat_per_100g"         numeric(7,2)             DEFAULT 0,
  "fiber_per_100g"       numeric(7,2)             DEFAULT 0,
  "source_url"           text,
  "created_by"           text                     DEFAULT 'community'::text,
  "created_at"           timestamp with time zone DEFAULT now(),
  "updated_at"           timestamp with time zone DEFAULT now(),
  "user_id"              text,
  "is_custom"            boolean                  DEFAULT false,
  "package_weight_grams" numeric,
  "piece_count"          numeric,
  CONSTRAINT "food_items_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."food_items"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."food_items"
  FORCE ROW LEVEL SECURITY;

CREATE TABLE "public"."sessions" (
  "id"           text                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"      text                     NOT NULL,
  "workout_id"   text                     NOT NULL,
  "status"       text                     NOT NULL DEFAULT 'completed'::text,
  "sleep_hours"  numeric(5,2)             DEFAULT 8.0,
  "energy_score" integer                  DEFAULT 7,
  "started_at"   timestamp with time zone DEFAULT now(),
  "completed_at" timestamp with time zone DEFAULT now(),
  "notes"        text,
  "photos"       jsonb                    DEFAULT '[]'::jsonb,
  CONSTRAINT "sessions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."sessions"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."sessions"
  FORCE ROW LEVEL SECURITY;

CREATE TABLE "public"."sets" (
  "id"               text                     NOT NULL DEFAULT gen_random_uuid(),
  "session_id"       text                     NOT NULL,
  "user_id"          text                     NOT NULL,
  "exercise_id"      text                     NOT NULL,
  "set_number"       integer                  NOT NULL,
  "weight"           numeric(6,2),
  "reps"             integer,
  "rir"              integer,
  "duration_seconds" integer,
  "pain_score"       integer                  DEFAULT 0,
  "logged_at"        timestamp with time zone DEFAULT now(),
  "started_at"       timestamp with time zone,
  "rest_seconds"     integer                  DEFAULT 0,
  CONSTRAINT "sets_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."sets"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."sets"
  FORCE ROW LEVEL SECURITY;

CREATE TABLE "public"."system" (
  "id"           text                     NOT NULL,
  "seed_version" text                     NOT NULL,
  "updated_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "system_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."system"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."users" (
  "id"                            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"                       text                     NOT NULL,
  "email"                         text                     NOT NULL,
  "name"                          text,
  "last_completed_workout_order"  integer                  DEFAULT 0,
  "max_workout_order"             integer                  DEFAULT 0,
  "last_set_summary_per_exercise" jsonb                    DEFAULT '{}'::jsonb,
  "created_at"                    timestamp with time zone DEFAULT now(),
  "metrics"                       jsonb                    DEFAULT '{}'::jsonb,
  "date_of_birth"                 date,
  "gender"                        text,
  "height_cm"                     numeric(5,2),
  "weight_kg"                     numeric(5,2),
  "fitness_level"                 text,
  "training_location"             text,
  "updated_at"                    timestamp with time zone DEFAULT now(),
  CONSTRAINT "users_pkey" PRIMARY KEY (id),
  CONSTRAINT "users_user_id_key" UNIQUE (user_id),
  CONSTRAINT "users_user_id_unique" UNIQUE (user_id)
);

ALTER TABLE "public"."users"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."users"
  FORCE ROW LEVEL SECURITY;

CREATE TABLE "public"."workout_drafts" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"      uuid                     NOT NULL,
  "workout_id"   text                     NOT NULL,
  "inputs"       jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "sleep_hours"  numeric,
  "energy_score" integer,
  "notes"        text,
  "session_date" timestamp with time zone,
  "updated_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "workout_drafts_pkey" PRIMARY KEY (id),
  CONSTRAINT "workout_drafts_user_id_workout_id_key" UNIQUE (user_id, workout_id)
);

ALTER TABLE "public"."workout_drafts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."workout_exercises" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     text                     NOT NULL,
  "workout_id"  text                     NOT NULL,
  "exercise_id" text                     NOT NULL,
  "sort_order"  integer                  NOT NULL DEFAULT 0,
  "created_at"  timestamp with time zone DEFAULT now(),
  "position"    integer                  DEFAULT 0,
  CONSTRAINT "workout_exercises_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."workout_exercises"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."workout_exercises"
  FORCE ROW LEVEL SECURITY;

CREATE TABLE "public"."workouts" (
  "id"           text                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"      text                     NOT NULL,
  "name"         text                     NOT NULL,
  "order"        integer                  NOT NULL DEFAULT 1,
  "exercise_ids" text[]                   DEFAULT '{}'::text[],
  "created_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "workouts_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."workouts"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."workouts"
  FORCE ROW LEVEL SECURITY;

CREATE TYPE "public"."exercise_type" AS ENUM (
  'strength',
  'timed'
);

CREATE TYPE "public"."session_status" AS ENUM (
  'in_progress',
  'completed'
);

ALTER TABLE "public"."dietary_log_entries"
  ADD CONSTRAINT "fk_dietary_log_entries_dietary_log" FOREIGN KEY (dietary_log_id) REFERENCES public.dietary_logs(id) ON DELETE CASCADE;

ALTER TABLE "public"."dietary_log_entries"
  ADD CONSTRAINT "fk_dietary_log_entries_food_item" FOREIGN KEY (food_item_id) REFERENCES public.food_items(id) ON DELETE SET NULL;

ALTER TABLE "public"."sets"
  ADD CONSTRAINT "fk_sets_exercise" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE RESTRICT;

ALTER TABLE "public"."sets"
  ADD CONSTRAINT "fk_sets_session" FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

ALTER TABLE "public"."sets"
  ADD CONSTRAINT "sets_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

ALTER TABLE "public"."workout_exercises"
  ADD CONSTRAINT "fk_workout_exercises_exercise" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

ALTER TABLE "public"."sessions"
  ADD CONSTRAINT "fk_sessions_workout" FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE SET NULL;

ALTER TABLE "public"."workout_exercises"
  ADD CONSTRAINT "fk_workout_exercises_workout" FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE CASCADE;

CREATE INDEX idx_body_logs_user_date ON public.body_logs USING btree (user_id, log_date);

CREATE INDEX idx_dietary_log_entries_food_item ON public.dietary_log_entries USING btree (food_item_id);

CREATE INDEX idx_dietary_log_entries_food ON public.dietary_log_entries USING btree (food_item_id);

CREATE INDEX idx_dietary_log_entries_log ON public.dietary_log_entries USING btree (dietary_log_id);

CREATE INDEX idx_dietary_log_entries_user_date ON public.dietary_log_entries USING btree (user_id, logged_at DESC);

CREATE INDEX idx_dietary_log_entries_user_log ON public.dietary_log_entries USING btree (user_id, dietary_log_id);

CREATE INDEX idx_dietary_log_entries_user ON public.dietary_log_entries USING btree (user_id, logged_at DESC);

CREATE INDEX idx_dietary_logs_user_date ON public.dietary_logs USING btree (user_id, log_date DESC);

CREATE INDEX idx_drafts_user ON public.workout_drafts USING btree (user_id);

CREATE INDEX idx_food_items_brand ON public.food_items USING btree (brand);

CREATE INDEX idx_food_items_created_at ON public.food_items USING btree (created_at DESC);

CREATE INDEX idx_food_items_global_user ON public.food_items USING btree (user_id, is_custom);

CREATE INDEX idx_food_items_is_custom ON public.food_items USING btree (is_custom);

CREATE INDEX idx_food_items_name ON public.food_items USING btree (name);

CREATE INDEX idx_food_items_user_custom ON public.food_items USING btree (user_id, is_custom);

CREATE INDEX idx_food_items_user_id ON public.food_items USING btree (user_id);

CREATE INDEX idx_sessions_user_completed ON public.sessions USING btree (user_id, completed_at DESC);

CREATE INDEX idx_sessions_user_status_date ON public.sessions USING btree (user_id, status, started_at DESC);

CREATE INDEX idx_sessions_user_workout ON public.sessions USING btree (user_id, workout_id);

CREATE INDEX idx_sets_exercise_user ON public.sets USING btree (exercise_id, user_id);

CREATE INDEX idx_sets_session_id ON public.sets USING btree (session_id);

CREATE INDEX idx_sets_session_set_number ON public.sets USING btree (session_id, set_number);

CREATE INDEX idx_sets_session ON public.sets USING btree (session_id);

CREATE INDEX idx_sets_user_id ON public.sets USING btree (user_id);

CREATE INDEX idx_workout_exercises_exercise_id ON public.workout_exercises USING btree (exercise_id);

CREATE INDEX idx_workout_exercises_exercise ON public.workout_exercises USING btree (exercise_id);

CREATE INDEX idx_workout_exercises_order ON public.workout_exercises USING btree (workout_id, sort_order);

CREATE INDEX idx_workout_exercises_user_workout ON public.workout_exercises USING btree (user_id, workout_id, "position");

CREATE INDEX idx_workout_exercises_workout_id ON public.workout_exercises USING btree (workout_id);

CREATE INDEX idx_workout_exercises_workout ON public.workout_exercises USING btree (workout_id);

CREATE POLICY "Users can delete own body logs" ON "public"."body_logs"
  FOR DELETE
  TO "authenticated"
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Users can insert own body logs" ON "public"."body_logs"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can update own body logs" ON "public"."body_logs"
  FOR UPDATE
  TO "authenticated"
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can view own body logs" ON "public"."body_logs"
  FOR SELECT
  TO "authenticated"
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Users can delete own dietary_log_entries" ON "public"."dietary_log_entries"
  FOR DELETE
  TO "authenticated"
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Users can insert own dietary_log_entries" ON "public"."dietary_log_entries"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can update own dietary_log_entries" ON "public"."dietary_log_entries"
  FOR UPDATE
  TO "authenticated"
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can view own dietary_log_entries" ON "public"."dietary_log_entries"
  FOR SELECT
  TO "authenticated"
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Users can delete own dietary_logs" ON "public"."dietary_logs"
  FOR DELETE
  TO "authenticated"
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Users can insert own dietary_logs" ON "public"."dietary_logs"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can update own dietary_logs" ON "public"."dietary_logs"
  FOR UPDATE
  TO "authenticated"
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can view own dietary_logs" ON "public"."dietary_logs"
  FOR SELECT
  TO "authenticated"
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Allow all for authenticated users on exercises" ON "public"."exercises"
  FOR ALL
  TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon select on exercises" ON "public"."exercises"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "Users can delete custom exercises" ON "public"."exercises"
  FOR DELETE
  TO "authenticated"
  USING ((((auth.uid())::text = user_id) AND (is_custom = true)));

CREATE POLICY "Users can manage custom exercises" ON "public"."exercises"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((((auth.uid())::text = user_id) AND (is_custom = true)));

CREATE POLICY "Users can manage own exercises" ON "public"."exercises"
  FOR ALL
  TO PUBLIC
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can update custom exercises" ON "public"."exercises"
  FOR UPDATE
  TO "authenticated"
  USING ((((auth.uid())::text = user_id) AND (is_custom = true)))
  WITH CHECK ((((auth.uid())::text = user_id) AND (is_custom = true)));

CREATE POLICY "Users can view global and own exercises" ON "public"."exercises"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((user_id IS NULL) OR (is_custom = false) OR ((auth.uid())::text = user_id)));

CREATE POLICY "Allow delete own food_items" ON "public"."food_items"
  FOR DELETE
  TO "authenticated"
  USING (((is_custom = true) AND ((auth.uid())::text = user_id)));

CREATE POLICY "Allow insert food_items" ON "public"."food_items"
  FOR INSERT
  TO "authenticated"
  WITH
    CHECK
    ((((is_custom = true) AND ((auth.uid())::text = user_id)) OR ((is_custom = false) AND ((user_id IS NULL) OR (user_id = 'community'::text) OR ((auth.uid())::text = user_id)))));

CREATE POLICY "Allow public read access on food_items" ON "public"."food_items"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((user_id IS NULL) OR (is_custom = false) OR ((auth.uid())::text = user_id)));

CREATE POLICY "Allow update own food_items" ON "public"."food_items"
  FOR UPDATE
  TO "authenticated"
  USING (((is_custom = true) AND ((auth.uid())::text = user_id)))
  WITH CHECK (((is_custom = true) AND ((auth.uid())::text = user_id)));

CREATE POLICY "Allow all for authenticated users on sessions" ON "public"."sessions"
  FOR ALL
  TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon select on sessions" ON "public"."sessions"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "Users can delete own sessions" ON "public"."sessions"
  FOR DELETE
  TO "authenticated"
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Users can delete their own sessions" ON "public"."sessions"
  FOR DELETE
  TO "authenticated"
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Users can insert own sessions" ON "public"."sessions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can insert their own sessions" ON "public"."sessions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can manage own sessions" ON "public"."sessions"
  FOR ALL
  TO PUBLIC
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can select their own sessions" ON "public"."sessions"
  FOR SELECT
  TO "authenticated"
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Users can update own sessions" ON "public"."sessions"
  FOR UPDATE
  TO "authenticated"
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can update their own sessions" ON "public"."sessions"
  FOR UPDATE
  TO "authenticated"
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can view sessions" ON "public"."sessions"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((((auth.uid())::text = user_id) OR (status = 'completed'::text)));

CREATE POLICY "Allow all for authenticated users on sets" ON "public"."sets"
  FOR ALL
  TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon select on sets" ON "public"."sets"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "Users can delete own sets" ON "public"."sets"
  FOR DELETE
  TO "authenticated"
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Users can delete their own sets" ON "public"."sets"
  FOR DELETE
  TO "authenticated"
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Users can insert own sets" ON "public"."sets"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can insert their own sets" ON "public"."sets"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can manage own sets" ON "public"."sets"
  FOR ALL
  TO PUBLIC
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can select their own sets" ON "public"."sets"
  FOR SELECT
  TO "authenticated"
  USING (((auth.uid())::text = user_id));

CREATE POLICY "Users can update own sets" ON "public"."sets"
  FOR UPDATE
  TO "authenticated"
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can update their own sets" ON "public"."sets"
  FOR UPDATE
  TO "authenticated"
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can view sets" ON "public"."sets"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Public full access to system" ON "public"."system"
  FOR ALL
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow all for authenticated users on users" ON "public"."users"
  FOR ALL
  TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon select on users" ON "public"."users"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "Public users delete" ON "public"."users"
  FOR DELETE
  TO PUBLIC
  USING (true);

CREATE POLICY "Public users insert" ON "public"."users"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public users select" ON "public"."users"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public users update" ON "public"."users"
  FOR UPDATE
  TO PUBLIC
  USING (true);

CREATE POLICY "Users can insert own profile" ON "public"."users"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((((auth.uid())::text = (id)::text) OR ((auth.uid())::text = user_id)));

CREATE POLICY "Users can insert their own profile" ON "public"."users"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid() = (user_id)::uuid) OR ((auth.uid())::text = user_id)));

CREATE POLICY "Users can manage own profile" ON "public"."users"
  FOR ALL
  TO PUBLIC
  USING (((auth.uid() = id) OR ((auth.uid())::text = user_id)))
  WITH CHECK (((auth.uid() = id) OR ((auth.uid())::text = user_id)));

CREATE POLICY "Users can update own profile" ON "public"."users"
  FOR UPDATE
  TO "authenticated"
  USING ((((auth.uid())::text = (id)::text) OR ((auth.uid())::text = user_id)))
  WITH CHECK ((((auth.uid())::text = (id)::text) OR ((auth.uid())::text = user_id)));

CREATE POLICY "Users can update their own profile metrics" ON "public"."users"
  FOR UPDATE
  TO "authenticated"
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can update their own profile" ON "public"."users"
  FOR UPDATE
  TO "authenticated"
  USING (((auth.uid() = (user_id)::uuid) OR ((auth.uid())::text = user_id)));

CREATE POLICY "Users can view own profile" ON "public"."users"
  FOR SELECT
  TO "authenticated"
  USING ((((auth.uid())::text = (id)::text) OR ((auth.uid())::text = user_id)));

CREATE POLICY "Users can view profile" ON "public"."users"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Users can view their own profile" ON "public"."users"
  FOR SELECT
  TO "authenticated"
  USING (((auth.uid() = (user_id)::uuid) OR ((auth.uid())::text = user_id)));

CREATE POLICY "Users can manage own drafts" ON "public"."workout_drafts"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Allow all users full access to workout_exercises" ON "public"."workout_exercises"
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view workout exercises for shared routines" ON "public"."workout_exercises"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Users can manage own workout_exercises" ON "public"."workout_exercises"
  FOR ALL
  TO PUBLIC
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can manage their own workout exercises" ON "public"."workout_exercises"
  FOR ALL
  TO "authenticated"
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Allow all for authenticated users on workouts" ON "public"."workouts"
  FOR ALL
  TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon select on workouts" ON "public"."workouts"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "Public can view workouts for shared sessions" ON "public"."workouts"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Users can manage own workouts" ON "public"."workouts"
  FOR ALL
  TO PUBLIC
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Users can manage their own workouts" ON "public"."workouts"
  FOR ALL
  TO "authenticated"
  USING (((auth.uid())::text = user_id))
  WITH CHECK (((auth.uid())::text = user_id));

CREATE POLICY "Allow authenticated users to delete photos" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'media'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Allow authenticated users to upload photos" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((bucket_id = 'media'::text));

CREATE POLICY "Allow public read access to workout media" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'media'::text));

CREATE POLICY "Users can delete their own media" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'media'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Users can only view their own media files" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'media'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Users can upload to their own folder" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'media'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

REVOKE ALL ON SCHEMA "public" FROM "anon";

GRANT CREATE, USAGE ON SCHEMA "public" TO "anon";

REVOKE ALL ON SCHEMA "public" FROM "authenticated";

GRANT CREATE, USAGE ON SCHEMA "public" TO "authenticated";

REVOKE ALL ON SCHEMA "public" FROM "postgres";

GRANT CREATE, USAGE ON SCHEMA "public" TO "postgres";

REVOKE ALL ON SCHEMA "public" FROM "service_role";

GRANT CREATE, USAGE ON SCHEMA "public" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."body_logs" TO "anon", "authenticated", "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."dietary_log_entries" TO "anon", "authenticated", "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."dietary_logs" TO "anon", "authenticated", "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exercises" TO "anon", "authenticated", "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."food_items" TO "anon", "authenticated", "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sessions" TO "anon", "authenticated", "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sets" TO "anon", "authenticated", "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."system" TO "anon", "authenticated", "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "anon", "authenticated", "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."workout_drafts" TO "anon", "authenticated", "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."workout_exercises" TO "anon", "authenticated", "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."workouts" TO "anon", "authenticated", "postgres";

GRANT USAGE ON TYPE "public"."exercise_type" TO "postgres";

GRANT USAGE ON TYPE "public"."session_status" TO "postgres";

