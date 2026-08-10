-- Add role to profiles and status/observation to tasks

-- 1. profiles.role
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Backfill roles from auth.users raw_user_meta_data where available
UPDATE public.profiles p
SET role = COALESCE(a.raw_user_meta_data->>'role', 'user')
FROM auth.users a
WHERE p.id = a.id
  AND a.raw_user_meta_data->>'role' IS NOT NULL;

-- 2. tasks status/observation
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS observation TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id);

-- 3. RLS: tasks_update allows assignee to update (mark as completed / observation)
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- 4. RLS: profiles_update only for admins (and analistas can read all)
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));