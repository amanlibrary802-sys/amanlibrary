const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function exportCredentials() {
  const { data, error } = await supabase
    .from('students')
    .select('name, whatsapp_number, batch, role')
    .eq('role', 'student');

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  const targetBatches = [
    'HS-1', 'HS-2', 'BS-1', 'BS-2', 'BS-3', 'BS-4', 'BS-5'
  ];

  const grouped = {};
  targetBatches.forEach(b => grouped[b] = []);

  data.forEach(student => {
    if (student.batch && targetBatches.includes(student.batch.toUpperCase().trim())) {
      grouped[student.batch.toUpperCase().trim()].push(student);
    }
  });

  let markdown = `# Student Login Credentials (HS-1 to BS-5)\n\n`;
  markdown += `*Note: Students log in using their **Name** as the Student ID and their **WhatsApp Number** as the Password.*\n\n`;

  targetBatches.forEach(batch => {
    const students = grouped[batch];
    if (students && students.length > 0) {
      markdown += `## ${batch}\n\n`;
      markdown += `| Student Name (ID) | WhatsApp Number (Password) |\n`;
      markdown += `| :--- | :--- |\n`;
      students.sort((a, b) => a.name.localeCompare(b.name)).forEach(s => {
        markdown += `| ${s.name} | ${s.whatsapp_number} |\n`;
      });
      markdown += `\n`;
    } else {
      markdown += `## ${batch}\n\n*No students found in this batch.*\n\n`;
    }
  });

  // Also write to an artifact file
  const artifactPath = path.join(process.cwd(), 'credentials_export.md');
  fs.writeFileSync(artifactPath, markdown);
  console.log(`Successfully exported to ${artifactPath}`);
  console.log('--- OUTPUT START ---');
  console.log(markdown);
  console.log('--- OUTPUT END ---');
}

exportCredentials();
