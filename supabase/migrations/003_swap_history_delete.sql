-- Phase 3: DELETE policy for swap_history (needed for box reset)
CREATE POLICY "swap_history_delete" ON swap_history FOR DELETE USING (true);
