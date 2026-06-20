-- ============================================================
-- Aman Library — Database Fix Script
-- Run this once in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. Normalise category names to canonical values ──────────
-- Fix "Motivation & Psychology" variants → "Motivation and Psychology"
UPDATE public.books
SET category = 'Motivation and Psychology'
WHERE lower(category) IN (
  'motivation & psychology',
  'motivation and psychology',
  'motivation psychology'
);

-- Fix "Autobiography" variants → "Auto and Biography"
UPDATE public.books
SET category = 'Auto and Biography'
WHERE lower(category) IN (
  'autobiography',
  'auto and biography',
  'biography',
  'auto biography'
);

-- Fix common case/spacing issues for other categories
UPDATE public.books SET category = 'Religion'    WHERE lower(category) = 'religion';
UPDATE public.books SET category = 'Study'       WHERE lower(category) = 'study';
UPDATE public.books SET category = 'Literature'  WHERE lower(category) = 'literature';
UPDATE public.books SET category = 'History'     WHERE lower(category) = 'history';
UPDATE public.books SET category = 'Science'     WHERE lower(category) = 'science';
UPDATE public.books SET category = 'Language'    WHERE lower(category) = 'language';
UPDATE public.books SET category = 'Dictionary'  WHERE lower(category) = 'dictionary';
UPDATE public.books SET category = 'Kithabs'     WHERE lower(category) = 'kithabs';

-- ── 2. Add missing columns to students table ─────────────────
-- Add 'batch' column (safe — does nothing if it already exists)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS batch text;

-- ── 3. Diagnostic — run these SELECT statements to verify ────
-- Check category distribution after fix:
SELECT category, count(*) AS book_count
FROM public.books
GROUP BY category
ORDER BY category;

-- Check for any books still with NULL or unexpected category:
SELECT book_id, title, category
FROM public.books
WHERE category IS NULL
   OR category NOT IN (
     'Religion', 'Study', 'Literature', 'Motivation and Psychology',
     'History', 'Auto and Biography', 'Science', 'Language',
     'Dictionary', 'Kithabs'
   );

-- Check students table columns:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;
