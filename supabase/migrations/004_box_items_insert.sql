-- Phase 3: INSERT policy for box_items (needed for box reset)
CREATE POLICY "box_items_insert" ON box_items FOR INSERT WITH CHECK (true);
