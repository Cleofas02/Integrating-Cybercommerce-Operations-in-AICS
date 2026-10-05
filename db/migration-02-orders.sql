-- ============================================================
-- Migration 02: real orders.
--   * no discount, no service fee (the school covers it), cash only
--   * a 6-digit reference_no for the second check at the counter
--   * claimed_at + removed, so claimed orders can leave the admin list
--   * order codes (ORD-1004, ORD-1005 ...) come from a SEQUENCE
-- Run once in the Neon SQL Editor.
-- BEGIN ... COMMIT = a transaction: either EVERYTHING below works, or NOTHING changes.
-- If you see an error, run  ROLLBACK;  once, fix the problem, then run the whole file again.
-- ============================================================
BEGIN;

-- 1. With no fees or discounts, total is just the sum of the items.
--    Recalculate it for the sample orders (a "subquery" = a SELECT inside another statement).
UPDATE orders o
SET total = COALESCE(
  (SELECT SUM(oi.quantity * oi.unit_price) FROM order_items oi WHERE oi.order_id = o.id),
  0
);

-- 2. Remove the columns we no longer need. (subtotal would always equal total now.)
ALTER TABLE orders
  DROP COLUMN subtotal,
  DROP COLUMN discount,
  DROP COLUMN service_fee;

-- 3. Cash at the counter is the only payment method. A CHECK constraint makes the
--    database itself refuse anything else, even if our code had a bug.
UPDATE orders SET payment_method = 'Cash at the counter';
ALTER TABLE orders ALTER COLUMN payment_method SET DEFAULT 'Cash at the counter';
ALTER TABLE orders ADD CONSTRAINT orders_payment_cash_only CHECK (payment_method = 'Cash at the counter');

-- 4. Reference number: add the column (empty), fill the sample orders, THEN make it required.
--    We use the same numbers the mock data had, so your sample tickets still match.
ALTER TABLE orders ADD COLUMN reference_no TEXT;
UPDATE orders SET reference_no = CASE id
  WHEN 1 THEN '482915'
  WHEN 2 THEN '730164'
  WHEN 3 THEN '259048'
  ELSE lpad((100000 + floor(random() * 900000))::int::text, 6, '0')
END;
ALTER TABLE orders ALTER COLUMN reference_no SET NOT NULL;
ALTER TABLE orders ADD CONSTRAINT orders_reference_no_key UNIQUE (reference_no);
ALTER TABLE orders ADD CONSTRAINT orders_reference_no_format CHECK (reference_no ~ '^[0-9]{6}$');

-- 5. When was it claimed, and has the admin removed it from the list?
--    "Removed" only HIDES the order (same idea as archived on menu_items),
--    so the sales numbers still count it.
ALTER TABLE orders ADD COLUMN claimed_at TIMESTAMPTZ;
UPDATE orders SET claimed_at = created_at WHERE status = 'Claimed';
ALTER TABLE orders ADD COLUMN removed BOOLEAN NOT NULL DEFAULT false;

-- 6. A sequence is a counter that never gives the same number twice, even when two
--    students order at the same moment. Your sample orders used ORD-1001 to 1003.
CREATE SEQUENCE order_code_seq START 1004;

COMMIT;

-- Check: you should see your 3 sample orders with reference numbers and no fee columns.
SELECT id, code, user_id, pickup_time, payment_method, total, status, reference_no, claimed_at, removed
FROM orders ORDER BY id;
