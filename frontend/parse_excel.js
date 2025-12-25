const XLSX = require('xlsx');
const workbook = XLSX.readFile('/Users/nikolashulewsky/Desktop/2025 Clinical Systems Review Template 9-21-25.xlsx');

// Show all sheet names
console.log('=== SHEET NAMES ===');
workbook.SheetNames.forEach((name, i) => console.log(i + ':', name));

// Find System 2 sheet
let system2SheetName = workbook.SheetNames.find(name => 
  name === '2' || 
  name.startsWith('2 ') || 
  name.startsWith('2.') ||
  name.includes('Sys 2') ||
  name.includes('System 2') ||
  name.toLowerCase().includes('fall') || 
  name.toLowerCase().includes('accident')
);

console.log('\n=== System 2 Sheet ===');
console.log('Found:', system2SheetName);

if (system2SheetName) {
  const sheet = workbook.Sheets[system2SheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  console.log('\n=== SYSTEM 2 CONTENT ===');
  data.forEach((row, idx) => {
    const hasContent = row.some(cell => cell !== '');
    if (hasContent) {
      console.log('Row ' + idx + ':', JSON.stringify(row));
    }
  });
}
