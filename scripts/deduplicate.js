const fs = require('fs');

// 1. Manually parse .env.local
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  envFile.split('\n').forEach(line => {
    const [k, ...rest] = line.split('=');
    const v = rest.join('=');
    if (k && v) process.env[k.trim()] = v.trim();
  });
  console.log("Successfully loaded environment variables from .env.local");
} catch (e) {
  console.error("Warning: Could not read .env.local file. Ensure it exists in the root directory.");
}

const { createClient } = require('@supabase/supabase-js');

// 2. Initialize Supabase Admin Client to bypass Row Level Security
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function runDeduplication() {
  console.log("Fetching all books from the database...");
  const { data: books, error } = await supabaseAdmin.from('books').select('*');
  
  if (error) {
    console.error("Error fetching books:", error);
    process.exit(1);
  }

  console.log(`Successfully fetched ${books.length} books.`);

  // 3. Group books solely by Title, Author, and Location (ignoring status completely)
  const groupedBooks = {};

  for (const book of books) {
    const title = (book.title || '').trim().toLowerCase();
    const author = (book.author || '').trim().toLowerCase();
    const loc = (book.shelf_loc || '').trim().toLowerCase();
    
    // Core grouping criteria
    const compositeKey = `${title}|${author}|${loc}`;
    
    if (!groupedBooks[compositeKey]) {
      groupedBooks[compositeKey] = [];
    }
    groupedBooks[compositeKey].push(book);
  }

  const idsToDelete = [];
  let duplicateGroupsFound = 0;

  for (const [key, items] of Object.entries(groupedBooks)) {
    if (items.length > 1) {
      duplicateGroupsFound++;
      
      // 4. Status Preservation Rule
      // We score them so 'Issued' floats to the top (index 0), followed by 'Reserved', then 'Available'
      items.sort((a, b) => {
        const getScore = (status) => {
          if (status === 'Issued') return 3;
          if (status === 'Reserved') return 2;
          if (status === 'Available') return 1;
          return 0; // Unknown status
        };
        return getScore(b.status) - getScore(a.status);
      });
      
      // The "winner" is the one at index 0
      const original = items[0];
      // The rest are clones meant to be destroyed
      const clones = items.slice(1);
      
      console.log(`\nDuplicate Group Found for: "${original.title}"`);
      console.log(`[KEEPING]  ID: ${original.book_id} | Status: ${original.status}`);
      
      for (const clone of clones) {
        console.log(`[DELETING] ID: ${clone.book_id} | Status: ${clone.status}`);
        idsToDelete.push(clone.book_id);
      }
    }
  }

  console.log(`\n======================================`);
  console.log(`Found ${duplicateGroupsFound} distinct duplicate groups.`);
  console.log(`Total duplicate records tagged for deletion: ${idsToDelete.length}`);
  
  if (idsToDelete.length === 0) {
    console.log("No duplicates found! Your database is clean.");
    return;
  }

  console.log("\nStarting deletion of duplicate records...");
  
  // 5. Execute Deletion Safely in Chunks
  const chunkSize = 50;
  for (let i = 0; i < idsToDelete.length; i += chunkSize) {
    const chunk = idsToDelete.slice(i, i + chunkSize);
    const { error: deleteError } = await supabaseAdmin
      .from('books')
      .delete()
      .in('book_id', chunk);

    if (deleteError) {
      console.error(`Failed to delete chunk:`, deleteError);
    } else {
      console.log(`Successfully purged ${chunk.length} duplicate records.`);
    }
  }

  console.log("\nDeduplication fully complete! Please refresh your admin dashboard.");
}

runDeduplication();
