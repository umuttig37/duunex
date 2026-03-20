-- Email delivery logs (deduplication + audit trail)

CREATE TABLE IF NOT EXISTS email_delivery_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,

  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email TEXT,

  -- queued -> sent -> failed (skipped is used for dedup situations)
  status TEXT NOT NULL DEFAULT 'queued',
  error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_created_at
  ON email_delivery_logs(created_at DESC);

-- Deduplicate by event+recipient
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_delivery_logs_dedup
  ON email_delivery_logs(event_type, event_id, recipient_id);

