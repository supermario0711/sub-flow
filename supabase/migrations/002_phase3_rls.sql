-- Phase 3: Write policies for box management (demo app, no auth)
CREATE POLICY "box_items_update" ON box_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "box_items_delete" ON box_items FOR DELETE USING (true);
CREATE POLICY "boxes_update" ON boxes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "swap_history_insert" ON swap_history FOR INSERT WITH CHECK (true);
