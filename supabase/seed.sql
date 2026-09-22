-- Basic public exercise library: chest, back, legs, arms.
-- Applied to staging via Supabase MCP on 2026-07-28.

INSERT INTO public.exercises (name, description, muscle_group, equipment, is_public) VALUES
  ('Bench Press', 'Classic barbell chest compound movement', 'chest', 'barbell', true),
  ('Incline Bench Press', 'Barbell press on an incline bench, targets upper chest', 'chest', 'barbell', true),
  ('Push-Up', 'Bodyweight chest press', 'chest', 'bodyweight', true),
  ('Dumbbell Chest Fly', 'Isolation movement for chest with dumbbells', 'chest', 'dumbbell', true),
  ('Cable Crossover', 'Cable isolation movement for chest', 'chest', 'cable', true),

  ('Deadlift', 'Barbell hip-hinge, full posterior chain', 'back', 'barbell', true),
  ('Pull-Up', 'Bodyweight vertical pull for back and biceps', 'back', 'bodyweight', true),
  ('Lat Pulldown', 'Cable machine vertical pull', 'back', 'cable', true),
  ('Bent-Over Row', 'Barbell horizontal pull for the back', 'back', 'barbell', true),
  ('Seated Cable Row', 'Cable horizontal pull', 'back', 'cable', true),

  ('Squat', 'Barbell compound movement for legs', 'legs', 'barbell', true),
  ('Leg Press', 'Machine compound movement for legs', 'legs', 'machine', true),
  ('Lunges', 'Dumbbell unilateral leg movement', 'legs', 'dumbbell', true),
  ('Leg Extension', 'Machine isolation for quadriceps', 'legs', 'machine', true),
  ('Leg Curl', 'Machine isolation for hamstrings', 'legs', 'machine', true),

  ('Barbell Curl', 'Barbell isolation for biceps', 'arms', 'barbell', true),
  ('Tricep Pushdown', 'Cable isolation for triceps', 'arms', 'cable', true),
  ('Hammer Curl', 'Dumbbell isolation for biceps and forearms', 'arms', 'dumbbell', true),
  ('Skull Crusher', 'Barbell isolation for triceps', 'arms', 'barbell', true),
  ('Dumbbell Curl', 'Dumbbell isolation for biceps', 'arms', 'dumbbell', true)
ON CONFLICT DO NOTHING;
