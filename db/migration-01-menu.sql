-- ============================================================
-- Migration 01: make menu_items ready for the admin to manage.
-- Run once in the Neon SQL Editor. (A migration = a change to a table that already has data.)
-- ============================================================

-- 1. Emoji column, so each item's picture comes from the database.
ALTER TABLE menu_items ADD COLUMN emoji TEXT NOT NULL DEFAULT '🍽️';

-- 2. "Remove" will HIDE an item instead of deleting it. We can't truly delete
--    items that old orders point to (the foreign key in order_items protects them).
--    This is called a soft delete.
ALTER TABLE menu_items ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;

-- 3. Item names were UNIQUE across all rows. With soft delete that would stop you
--    from re-adding a removed item, so make the name unique only among items that
--    are NOT archived (a "partial" index). lower() makes "Iced Tea" and "iced tea" the same.
--    If the DROP line errors, find the constraint's real name with:
--    SELECT conname FROM pg_constraint WHERE conrelid = 'menu_items'::regclass;
ALTER TABLE menu_items DROP CONSTRAINT menu_items_name_key;
CREATE UNIQUE INDEX menu_items_name_active ON menu_items (lower(name)) WHERE NOT archived;

-- 4. Give the existing items their emojis.
UPDATE menu_items SET emoji = CASE name
  WHEN 'Chicken Adobo Rice' THEN '🍛'
  WHEN 'Pork Sinigang Bowl' THEN '🍲'
  WHEN 'Egg Sandwich'       THEN '🥪'
  WHEN 'Banana Cue'         THEN '🍌'
  WHEN 'Iced Tea'           THEN '🧋'
  WHEN 'Buko Juice'         THEN '🥥'
  WHEN 'Intramurals Ticket' THEN '🎟️'
  WHEN 'Class T-shirt Fee'  THEN '👕'
  ELSE emoji
END;

-- Check: you should see 8 rows with emojis.
SELECT id, name, emoji, price, is_available, archived FROM menu_items ORDER BY id;
