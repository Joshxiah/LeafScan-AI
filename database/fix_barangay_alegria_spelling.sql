-- ============================================================
-- LeafScan AI - Barangay list is now the full 54 of Pagadian City
--
-- The fixed barangay list (backend/src/constants/barangays.ts) used
-- to hold 19 names, one of them misspelled "Alegeria". It now holds
-- all 54, with the correct spelling "Alegria". Anything already saved
-- as "Alegeria" would show as an off-list (amber) value and be
-- rejected on re-save, so rename it everywhere it was stored.
--
-- Run ONCE on any database that has data (dev, and the production
-- VPS), after add_agriculturist_barangays.sql. Safe to re-run.
-- ============================================================

USE leafscan_ai;

UPDATE farmers  SET barangay = 'Alegria' WHERE barangay = 'Alegeria';
UPDATE farmers  SET address  = 'Alegria' WHERE address  = 'Alegeria';
UPDATE reports  SET barangay = 'Alegria' WHERE barangay = 'Alegeria';
UPDATE agriculturists SET barangay = 'Alegria' WHERE barangay = 'Alegeria';

-- agriculturist_barangays has (agriculturist_id, barangay) as its
-- primary key. UPDATE IGNORE skips a row whose renamed twin already
-- exists; the DELETE then clears any "Alegeria" row left behind.
UPDATE IGNORE agriculturist_barangays SET barangay = 'Alegria' WHERE barangay = 'Alegeria';
DELETE FROM agriculturist_barangays WHERE barangay = 'Alegeria';

-- ============================================================
-- END
-- ============================================================
