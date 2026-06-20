/**
 * migrate-localstorage.ts
 * ─────────────────────────────────────────────────────────────────
 * ONE-TIME UTILITY — Run this from the browser console on any admin
 * page to check for books still stuck in localStorage and push them
 * to Supabase.
 *
 * HOW TO USE:
 *   1. Open your app in the browser and navigate to any admin page.
 *   2. Open DevTools → Console.
 *   3. Copy-paste the migrateLocalStorageBooks() function below and
 *      call it:  await migrateLocalStorageBooks()
 *   4. Read the printed report. Confirm before any data is inserted.
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from '@/lib/supabase/client';

// Keys that were commonly used in older localStorage-based versions
const LEGACY_KEYS = [
  'library_books',
  'aman_books',
  'books',
  'libraryBooks',
  'amanLibrary',
];

interface LegacyBook {
  id?: string;
  title?: string;
  author?: string;
  category?: string;
  shelf_loc?: string;
  location?: string;
  total_copies?: number;
  copies?: number;
  status?: string;
}

/**
 * Normalises a raw localStorage book object to match the Supabase schema.
 */
function normalise(raw: LegacyBook) {
  const category = raw.category?.trim() || 'Religion';
  const prefixMap: Record<string, string> = {
    religion: 'R', study: 'S', literature: 'L',
    'motivation & psychology': 'M', history: 'H',
    autobiography: 'A', science: 'Sc', language: 'La',
    dictionary: 'D', kithabs: 'K',
  };
  const prefix = prefixMap[category.toLowerCase()] ?? category[0].toUpperCase();
  const rawLoc  = raw.shelf_loc || raw.location || '';
  const shelf_loc = rawLoc
    ? (/^[A-Za-z]/i.test(rawLoc) ? rawLoc.toUpperCase() : `${prefix}-${rawLoc}`)
    : undefined;

  return {
    title:        (raw.title || '').trim(),
    author:       (raw.author || '').trim(),
    category:     category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
    shelf_loc:    shelf_loc,
    total_copies: raw.total_copies ?? raw.copies ?? 1,
    status:       raw.status || 'Available',
  };
}

export async function migrateLocalStorageBooks(dryRun = true) {
  console.group('📚 Aman Library — localStorage → Supabase Migration');

  // ── 1. Scan localStorage ────────────────────────────────────────
  const found: LegacyBook[] = [];

  for (const key of LEGACY_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const arr: LegacyBook[] = Array.isArray(parsed) ? parsed : [parsed];
      console.log(`🔍 Found ${arr.length} record(s) under key "${key}"`);
      found.push(...arr);
    } catch {
      console.warn(`⚠️  Could not parse localStorage key "${key}" — skipping.`);
    }
  }

  if (found.length === 0) {
    console.log('✅ No legacy books found in localStorage. Nothing to migrate.');
    console.groupEnd();
    return;
  }

  // ── 2. De-duplicate & filter valid entries ──────────────────────
  const valid = found
    .filter(b => b.title && b.author)
    .map(normalise);

  const seen = new Set<string>();
  const unique = valid.filter(b => {
    const key = `${b.title.toLowerCase()}__${b.author.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`📋 ${unique.length} valid unique books found in localStorage:`);
  console.table(unique);

  // ── 3. Cross-check against Supabase ────────────────────────────
  const { data: existing } = await supabase
    .from('books')
    .select('title, author')
    .range(0, 9999);

  const existingSet = new Set(
    (existing || []).map(b => `${b.title.toLowerCase()}__${b.author.toLowerCase()}`)
  );

  const toInsert = unique.filter(b => {
    const key = `${b.title.toLowerCase()}__${b.author.toLowerCase()}`;
    return !existingSet.has(key);
  });

  const alreadyPresent = unique.length - toInsert.length;

  console.log(`\n📊 Summary:`);
  console.log(`   Already in Supabase : ${alreadyPresent}`);
  console.log(`   Missing (to insert) : ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log('✅ All localStorage books are already in Supabase. No action needed.');
    console.groupEnd();
    return;
  }

  console.log('\n🆕 Books that will be inserted:');
  console.table(toInsert);

  // ── 4. Insert (skipped in dry-run mode) ────────────────────────
  if (dryRun) {
    console.warn('\n🛑 DRY RUN — no data written. Call migrateLocalStorageBooks(false) to actually insert.');
    console.groupEnd();
    return;
  }

  const { error } = await supabase.from('books').insert(toInsert);
  if (error) {
    console.error('❌ Insert failed:', error.message);
  } else {
    console.log(`✅ Successfully inserted ${toInsert.length} book(s) into Supabase!`);
    console.log('💡 You can now safely clear the legacy localStorage key(s).');
    // Optionally clean up old keys:
    // LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
  }

  console.groupEnd();
}

/**
 * Quick diagnostic — run this first to inspect what's in localStorage
 * without touching anything.
 *
 * Usage (browser console):
 *   import('/admin/books/migrate-localstorage').then(m => m.scanLocalStorage())
 */
export function scanLocalStorage() {
  console.group('🔍 localStorage Scan');
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    const val = localStorage.getItem(key) || '';
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.title) {
        console.log(`📚 Key: "${key}" — ${parsed.length} book-like record(s)`);
        total += parsed.length;
      }
    } catch { /* not JSON */ }
  }
  if (total === 0) console.log('Nothing found that looks like a books array.');
  else console.log(`\nTotal book-like records found: ${total}`);
  console.groupEnd();
}
