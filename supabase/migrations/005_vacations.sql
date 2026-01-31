CREATE TABLE vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX idx_vacations_user_id ON vacations(user_id);
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vacations_read" ON vacations FOR SELECT USING (true);
CREATE POLICY "vacations_insert" ON vacations FOR INSERT WITH CHECK (true);
CREATE POLICY "vacations_delete" ON vacations FOR DELETE USING (true);
