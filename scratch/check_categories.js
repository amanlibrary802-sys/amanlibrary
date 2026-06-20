const { createClient } = require('@supabase/supabase-js');
// No dotenv needed


const supabaseUrl = 'https://abqbtfcilrijajslvozq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicWJ0ZmNpbHJpamFqc2x2b3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTQzMDAsImV4cCI6MjA5MzgzMDMwMH0.CN2ejPcZsqiMdcIiIdq-VPn0u2jaWn2fWu-Wh2K7-wQ';
const supabase = createClient(supabaseUrl, supabaseKey);


async function checkCategories() {
  const { data, error } = await supabase
    .from('books')
    .select('category')
    .limit(5000);


  
  if (error) {
    console.error(error);
    return;
  }
  
  const categories = [...new Set(data.map(b => b.category))];
  console.log('Categories in DB:', categories);
}

checkCategories();
