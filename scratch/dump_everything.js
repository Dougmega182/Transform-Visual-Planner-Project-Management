const Database = require('better-sqlite3');
const fs = require('fs');
const XLSX = require('xlsx');

const db = new Database('./transform.db');

console.log('\n--- 1. DATABASE SCHEMA ---');
db.prepare("SELECT sql FROM sqlite_master WHERE type='table'").all().forEach(t => console.log(t.sql + '\n'));

console.log('\n--- 2. ROW COUNTS & SAMPLE DATA ---');
db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().forEach(t => {
  const c = db.prepare('SELECT COUNT(*) as n FROM ' + t.name).get();
  console.log(t.name + ':', c.n, 'rows');
  try {
    const sample = db.prepare('SELECT * FROM ' + t.name + ' LIMIT 2').all();
    sample.forEach(r => console.log('  ', JSON.stringify(r)));
  } catch(e) {}
});

console.log('\n--- 3. EXCEL STRUCTURE (Schedule_List_11-15 Station Street...) ---');
const file = './imports/Schedule_List_11-15 Station Street, Diamond Creek - FC.xlsx';
const wb = XLSX.read(fs.readFileSync(file), {type:'buffer'});
const d = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1});
for(let i=0; i<8; i++) console.log(JSON.stringify(d[i]));
