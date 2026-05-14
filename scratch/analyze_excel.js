const fs = require('fs');
const XLSX = require('xlsx');

const importDir = 'd:/Projects/IN_PROGRESS_PROJECTS/Transform™ Visual Planner/imports/';
const files = fs.readdirSync(importDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xlsm'));

files.forEach(f => {
  console.log('\n========================================');
  console.log('FILE:', f);
  console.log('========================================');
  try {
    const buf = fs.readFileSync(importDir + f);
    const wb = XLSX.read(buf, {type:'buffer'});
    console.log('SHEETS:', wb.SheetNames);
    wb.SheetNames.forEach(s => {
      const data = XLSX.utils.sheet_to_json(wb.Sheets[s], {header:1});
      console.log('\n--- Sheet:', s, '--- Rows:', data.length);
      for(let i=0; i<Math.min(5, data.length); i++) { // Limit to 5 rows to save output size
        console.log('Row '+i+':', JSON.stringify(data[i]));
      }
    });
  } catch(e) {
    console.error('Error reading', f, e.message);
  }
});
