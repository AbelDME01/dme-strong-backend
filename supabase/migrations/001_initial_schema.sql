-- =============================================================================
-- DME-Strong: Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Apply via Supabase SQL Editor or CLI
-- =============================================================================

-- user_profiles: extiende auth.users con datos de perfil
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  height_cm NUMERIC(5,2),
  birth_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- exercises: catálogo de ejercicios
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT NOT NULL, -- chest, back, legs, shoulders, arms, core, cardio, other
  equipment TEXT, -- barbell, dumbbell, machine, bodyweight, cable, other
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- routines: plantillas de entrenamiento
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- routine_exercises: ejercicios en una rutina
CREATE TABLE IF NOT EXISTS public.routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  order_index INTEGER NOT NULL DEFAULT 0,
  target_sets INTEGER,
  target_reps INTEGER,
  target_weight NUMERIC(6,2),
  rest_seconds INTEGER
);

-- workouts: sesiones de entrenamiento completadas
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES public.routines(id),
  name TEXT NOT NULL,
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- workout_sets: series realizadas en un workout
CREATE TABLE IF NOT EXISTS public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  set_number INTEGER NOT NULL DEFAULT 1,
  reps INTEGER,
  weight_kg NUMERIC(6,2),
  duration_seconds INTEGER,
  distance_meters NUMERIC(8,2),
  rpe NUMERIC(3,1), -- Rate of perceived exertion 1-10
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- records: PRs personales
CREATE TABLE IF NOT EXISTS public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  record_type TEXT NOT NULL, -- max_weight, max_reps, max_distance, max_duration
  value NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL, -- kg, reps, meters, seconds
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  workout_id UUID REFERENCES public.workouts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id, record_type)
);

-- measurements: medidas corporales
CREATE TABLE IF NOT EXISTS public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  weight_kg NUMERIC(5,2),
  body_fat_percentage NUMERIC(4,2),
  muscle_mass_kg NUMERIC(5,2),
  chest_cm NUMERIC(5,2),
  waist_cm NUMERIC(5,2),
  hips_cm NUMERIC(5,2),
  arm_cm NUMERIC(5,2),
  thigh_cm NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON public.routines(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_started_at ON public.workouts(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_id ON public.workout_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_records_user_exercise ON public.records(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_measurements_user_date ON public.measurements(user_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON public.exercises(muscle_group);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- user_profiles: solo el propio usuario
CREATE POLICY "user_profiles_own" ON public.user_profiles FOR ALL USING (auth.uid() = user_id);

-- exercises: públicos para leer, solo el creador para escribir
CREATE POLICY "exercises_read_public" ON public.exercises FOR SELECT USING (is_public = true OR auth.uid() = created_by);
CREATE POLICY "exercises_insert_auth" ON public.exercises FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
CREATE POLICY "exercises_update_own" ON public.exercises FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "exercises_delete_own" ON public.exercises FOR DELETE USING (auth.uid() = created_by);

-- routines: solo el propio usuario
CREATE POLICY "routines_own" ON public.routines FOR ALL USING (auth.uid() = user_id);

-- routine_exercises: a través de la rutina del usuario
CREATE POLICY "routine_exercises_own" ON public.routine_exercises FOR ALL
  USING (EXISTS (SELECT 1 FROM public.routines r WHERE r.id = routine_id AND r.user_id = auth.uid()));

-- workouts: solo el propio usuario
CREATE POLICY "workouts_own" ON public.workouts FOR ALL USING (auth.uid() = user_id);

-- workout_sets: a través del workout del usuario
CREATE POLICY "workout_sets_own" ON public.workout_sets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid()));

-- records: solo el propio usuario
CREATE POLICY "records_own" ON public.records FOR ALL USING (auth.uid() = user_id);

-- measurements: solo el propio usuario
CREATE POLICY "measurements_own" ON public.measurements FOR ALL USING (auth.uid() = user_id);
