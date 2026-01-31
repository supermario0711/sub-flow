ALTER TABLE boxes DROP CONSTRAINT boxes_status_check;
ALTER TABLE boxes ADD CONSTRAINT boxes_status_check
  CHECK (status IN ('draft', 'confirmed', 'delivered', 'skipped'));
