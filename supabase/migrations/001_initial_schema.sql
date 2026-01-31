SET LOCAL search_path TO public, extensions;

-- Available products (vegetables & fruits)
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('vegetable', 'fruit')),
  emoji text NOT NULL,
  image_url text,
  is_seasonal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User profiles (personas for demo)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  persona text NOT NULL CHECK (persona IN ('new', 'experienced', 'power')),
  created_at timestamptz DEFAULT now()
);

-- Weekly box assigned to a user
CREATE TABLE boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  week_start date NOT NULL,
  lock_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'delivered')),
  confirmed_at timestamptz,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Items in a box (join table)
CREATE TABLE box_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id uuid NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id),
  position int NOT NULL,
  added_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(box_id, position)
);

-- Swap history (for pattern detection in Phase 4)
CREATE TABLE swap_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id uuid NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  from_item_id uuid NOT NULL REFERENCES items(id),
  to_item_id uuid NOT NULL REFERENCES items(id),
  swapped_at timestamptz DEFAULT now()
);

-- Indexes on foreign keys
CREATE INDEX idx_boxes_user_id ON boxes(user_id);
CREATE INDEX idx_box_items_box_id ON box_items(box_id);
CREATE INDEX idx_box_items_item_id ON box_items(item_id);
CREATE INDEX idx_swap_history_box_id ON swap_history(box_id);
CREATE INDEX idx_swap_history_user_id ON swap_history(user_id);
CREATE INDEX idx_swap_history_from_item_id ON swap_history(from_item_id);
CREATE INDEX idx_swap_history_to_item_id ON swap_history(to_item_id);

-- Row-Level Security (read-only public access for Phase 1)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_read" ON items FOR SELECT USING (true);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read" ON users FOR SELECT USING (true);

ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boxes_read" ON boxes FOR SELECT USING (true);

ALTER TABLE box_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "box_items_read" ON box_items FOR SELECT USING (true);

ALTER TABLE swap_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "swap_history_read" ON swap_history FOR SELECT USING (true);
