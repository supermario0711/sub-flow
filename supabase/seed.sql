-- Seed data for Phase 1
-- Run with: supabase db reset

-- Items (5 vegetables, 5 fruits)
INSERT INTO items (id, name, category, emoji, is_seasonal) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Carrot',     'vegetable', '🥕', false),
  ('a1000000-0000-0000-0000-000000000002', 'Fennel',     'vegetable', '🌿', true),
  ('a1000000-0000-0000-0000-000000000003', 'Zucchini',   'vegetable', '🥒', true),
  ('a1000000-0000-0000-0000-000000000004', 'Broccoli',   'vegetable', '🥦', false),
  ('a1000000-0000-0000-0000-000000000005', 'Beetroot',   'vegetable', '🟤', true),
  ('a1000000-0000-0000-0000-000000000006', 'Apple',      'fruit',     '🍎', false),
  ('a1000000-0000-0000-0000-000000000007', 'Pear',       'fruit',     '🍐', true),
  ('a1000000-0000-0000-0000-000000000008', 'Orange',     'fruit',     '🍊', false),
  ('a1000000-0000-0000-0000-000000000009', 'Banana',     'fruit',     '🍌', false),
  ('a1000000-0000-0000-0000-000000000010', 'Strawberry', 'fruit',     '🍓', true);

-- Users (3 personas)
INSERT INTO users (id, name, slug, persona) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Sarah', 'sarah', 'new'),
  ('b1000000-0000-0000-0000-000000000002', 'Mark',  'mark',  'experienced'),
  ('b1000000-0000-0000-0000-000000000003', 'Lisa',  'lisa',  'power');

-- Boxes (one per user, current week Monday, lock Friday 10:00 CET)
INSERT INTO boxes (id, user_id, week_start, lock_at, status) VALUES
  ('c1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001',
   date_trunc('week', CURRENT_DATE)::date,
   date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 10 hours',
   'draft'),
  ('c1000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000002',
   date_trunc('week', CURRENT_DATE)::date,
   date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 10 hours',
   'draft'),
  ('c1000000-0000-0000-0000-000000000003',
   'b1000000-0000-0000-0000-000000000003',
   date_trunc('week', CURRENT_DATE)::date,
   date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 10 hours',
   'draft');

-- Box items (5 items per box)
-- Sarah's box
INSERT INTO box_items (box_id, item_id, position) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 1),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 2),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', 3),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000007', 4),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000009', 5);

-- Mark's box (Fennel at pos 1 — pattern detection will suggest swapping to Zucchini)
INSERT INTO box_items (box_id, item_id, position) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 1),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 2),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', 3),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000008', 4),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000010', 5);

-- Lisa's box
INSERT INTO box_items (box_id, item_id, position) VALUES
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 1),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 2),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 3),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000007', 4),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000010', 5);

-- Swap history: Mark swapped fennel -> zucchini 3 times in past weeks
INSERT INTO swap_history (box_id, user_id, from_item_id, to_item_id, swapped_at) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003',
   now() - INTERVAL '21 days'),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003',
   now() - INTERVAL '14 days'),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003',
   now() - INTERVAL '7 days');

-- Seed patterns for Mark (pre-calculated from swap history above)
-- dislike: min(0.95, 0.5 + 3 * 0.15) = 0.95
-- preference: min(0.90, 0.4 + 3 * 0.15) = 0.85
INSERT INTO patterns (id, user_id, type, item_id, confidence, occurrences, last_triggered_at, is_active) VALUES
  ('d1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000002', 'item_dislike',
   'a1000000-0000-0000-0000-000000000002', 0.95, 3, now() - INTERVAL '7 days', true),
  ('d1000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000002', 'item_preference',
   'a1000000-0000-0000-0000-000000000003', 0.85, 3, now() - INTERVAL '7 days', true);

-- Swap history: Lisa swaps vegetables for fruits — builds fruit preferences
INSERT INTO swap_history (box_id, user_id, from_item_id, to_item_id, swapped_at) VALUES
  -- Broccoli → Orange (2 weeks ago)
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000008',
   now() - INTERVAL '14 days'),
  -- Banana → Strawberry (kept from original)
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000010',
   now() - INTERVAL '10 days'),
  -- Fennel → Apple (1 week ago)
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006',
   now() - INTERVAL '7 days'),
  -- Carrot → Strawberry (5 days ago — gives Strawberry 2 occurrences)
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000010',
   now() - INTERVAL '5 days'),
  -- Broccoli → Orange (3 days ago — gives Orange 2 occurrences)
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000008',
   now() - INTERVAL '3 days');

-- Seed patterns for Lisa (pre-calculated from swap history above)
-- item_preference: min(0.90, 0.4 + 2 * 0.15) = 0.70
-- item_dislike for Broccoli: min(0.95, 0.5 + 2 * 0.15) = 0.80
INSERT INTO patterns (id, user_id, type, item_id, confidence, occurrences, last_triggered_at, is_active) VALUES
  ('d1000000-0000-0000-0000-000000000003',
   'b1000000-0000-0000-0000-000000000003', 'item_preference',
   'a1000000-0000-0000-0000-000000000010', 0.70, 2, now() - INTERVAL '5 days', true),
  ('d1000000-0000-0000-0000-000000000004',
   'b1000000-0000-0000-0000-000000000003', 'item_preference',
   'a1000000-0000-0000-0000-000000000008', 0.70, 2, now() - INTERVAL '3 days', true),
  ('d1000000-0000-0000-0000-000000000005',
   'b1000000-0000-0000-0000-000000000003', 'item_dislike',
   'a1000000-0000-0000-0000-000000000004', 0.80, 2, now() - INTERVAL '3 days', true);
