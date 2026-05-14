const fs = require('fs');
const XLSX = require('xlsx');
const Database = require('better-sqlite3');

console.log('--- DATABASE SCHEMA ---');
try {
  const db = new Database('d:/Projects/IN_PROGRESS_PROJECTS/Transform™ Visual Planner/transform.db');
  const tables = db.prepare("SELECT sql FROM sqlite_master WHERE type='table'").all();
  tables.forEach(t => console.log(t.sql));
} catch(e) {
  console.log('Error reading DB:', e);
}

console.log('\n--- EXCEL DATA ---');
try {
  const buf = fs.readFileSync('d:/Projects/IN_PROGRESS_PROJECTS/Transform™ Visual Planner/imports/Mondays_Summary_Live.xlsm');
  const wb = XLSX.read(buf, {type:'buffer'});
  const ws = wb.Sheets['Dashboard'];
  const data = XLSX.utils.sheet_to_json(ws, {header:1});
  for(let i=0; i<Math.min(15, data.length); i++) {
    console.log(`Row ${i}:`, JSON.stringify(data[i]));
  }
} catch(e) {
  console.log('Error reading Excel:', e);
}
