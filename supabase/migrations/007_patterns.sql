-- Phase 4: Patterns table for learning swap preferences

CREATE TABLE patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('item_dislike', 'item_preference')),
  item_id uuid NOT NULL REFERENCES items(id),
  confidence numeric(4,2) NOT NULL DEFAULT 0.00,
  occurrences int NOT NULL DEFAULT 0,
  last_triggered_at timestamptz,
  last_rejected_at timestamptz,
  rejection_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type, item_id)
);

CREATE INDEX idx_patterns_user_id ON patterns(user_id);
CREATE INDEX idx_patterns_item_id ON patterns(item_id);

ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patterns_read" ON patterns FOR SELECT USING (true);
CREATE POLICY "patterns_insert" ON patterns FOR INSERT WITH CHECK (true);
CREATE POLICY "patterns_update" ON patterns FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "patterns_delete" ON patterns FOR DELETE USING (true);

-- Add context column to swap_history
ALTER TABLE swap_history
  ADD COLUMN context text NOT NULL DEFAULT 'user_initiated'
  CHECK (context IN ('user_initiated', 'suggestion_accepted', 'suggestion_rejected'));
