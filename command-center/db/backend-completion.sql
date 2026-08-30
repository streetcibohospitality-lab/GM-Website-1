BEGIN;

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS reliability_pct numeric(5,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fill_rate_pct numeric(5,2);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS dedupe_key text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='vendors_reliability_pct_check') THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_reliability_pct_check CHECK (reliability_pct IS NULL OR reliability_pct BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='vendors_fill_rate_pct_check') THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_fill_rate_pct_check CHECK (fill_rate_pct IS NULL OR fill_rate_pct BETWEEN 0 AND 100);
  END IF;
END $$;

DROP INDEX IF EXISTS idx_purchases_invoice_unique;
CREATE UNIQUE INDEX IF NOT EXISTS uq_purchases_invoice ON purchases(outlet_id,vendor_id,purchase_date,invoice_no) WHERE invoice_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_sales_period ON daily_sales(business_date,outlet_id);
CREATE INDEX IF NOT EXISTS idx_channel_sales_period ON channel_sales(business_date,outlet_id);
CREATE INDEX IF NOT EXISTS idx_expenses_period_outlet ON expenses(period_id,outlet_id,expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_latest ON inventory_snapshots(outlet_id,item_id,snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status_due ON tasks(status,due_at);
CREATE INDEX IF NOT EXISTS idx_alerts_status_severity ON alerts(status,severity,detected_at DESC);

DROP INDEX IF EXISTS uq_alerts_dedupe;
CREATE UNIQUE INDEX uq_alerts_dedupe ON alerts(dedupe_key);

COMMIT;
