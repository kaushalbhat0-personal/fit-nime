-- RCCF-003: canonical exercise catalog. 12 exercises, 3 per stat.
-- Idempotent: safe to re-run (matched on slug, never duplicated).
-- quantity is measured in the row's unit.

insert into public.exercises
  (slug, name, description, category, unit, default_value, is_active)
values
  -- Strength
  ('push-ups', 'Push-ups', 'Upper-body pressing strength, no equipment.',
    'strength', 'reps', 10, true),
  ('squats', 'Squats', 'Lower-body strength through full range of motion.',
    'strength', 'reps', 15, true),
  ('lunges', 'Lunges', 'Single-leg strength and balance.',
    'strength', 'reps', 12, true),
  -- Endurance
  ('running', 'Running', 'Steady-state cardio for stamina.',
    'endurance', 'kilometers', 2, true),
  ('jumping-jacks', 'Jumping Jacks', 'Full-body cardio warm-up.',
    'endurance', 'reps', 30, true),
  ('cycling', 'Cycling', 'Low-impact endurance on bike or stationary.',
    'endurance', 'minutes', 20, true),
  -- Agility
  ('high-knees', 'High Knees', 'Fast foot turnover and coordination.',
    'agility', 'seconds', 60, true),
  ('burpees', 'Burpees', 'Explosive full-body agility and conditioning.',
    'agility', 'reps', 10, true),
  ('mountain-climbers', 'Mountain Climbers', 'Core-driven quick feet.',
    'agility', 'seconds', 45, true),
  -- Focus
  ('plank', 'Plank', 'Isometric core hold with steady breathing.',
    'focus', 'seconds', 60, true),
  ('yoga-flow', 'Yoga Flow', 'Slow mobility sequence with breath control.',
    'focus', 'minutes', 15, true),
  ('breathing', 'Breathing Practice', 'Guided slow breathing for recovery.',
    'focus', 'minutes', 5, true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  unit = excluded.unit,
  default_value = excluded.default_value,
  is_active = excluded.is_active;
