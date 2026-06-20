const fs = require('fs');
const path = require('path');

const dir = './src';
const replacements = {
  '#0d2b1a': 'var(--brand-dark)',
  '#1a4a2e': 'var(--brand-primary)',
  '#1a3c34': 'var(--brand-primary)',
  '#2d5a4e': 'var(--brand-primary-light)',
  '#d4af37': 'var(--brand-accent)',
  '#c49b2a': 'var(--brand-accent-dark)',
  '#f9f8f4': 'var(--brand-bg)',
  '#f8f7f2': 'var(--brand-bg)',
  '#F4D03F': 'var(--brand-accent-light)'
};

function walk(directory) {
  let results = [];
  const list = fs.readdirSync(directory);
  list.forEach(file => {
    file = path.join(directory, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(dir);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key, 'gi');
    content = content.replace(regex, value);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
