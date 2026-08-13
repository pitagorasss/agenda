-- Add 'forecast' status and forecast columns to tasks

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'forecast', 'completed'));

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS forecast_date TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS forecast_time TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS forecast_observation TEXT;