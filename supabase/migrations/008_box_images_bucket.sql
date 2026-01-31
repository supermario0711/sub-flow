-- Create storage bucket for AI-generated box images
INSERT INTO storage.buckets (id, name, public)
VALUES ('box-images', 'box-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for box images
CREATE POLICY "Public read access for box images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'box-images');

-- Service role write access for box images
CREATE POLICY "Service role write access for box images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'box-images');

CREATE POLICY "Service role update access for box images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'box-images');
