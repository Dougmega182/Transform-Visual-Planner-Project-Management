const fs = require('fs');
const XLSX = require('xlsx');
const Database = require('better-sqlite3');

const db = new Database('./transform.db');

console.log('\n--- 1. DATABASE TABLES & COUNTS ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => {
  const count = db.prepare('SELECT COUNT(*) as c FROM ' + t.name).get();
  console.log(t.name + ':', count.c, 'rows');
  const sample = db.prepare('SELECT * FROM ' + t.name + ' LIMIT 3').all();
  sample.forEach(r => console.log('  ', JSON.stringify(r)));
});

console.log('\n--- 2. DATABASE SCHEMA ---');
tables.forEach(t => {
  const sql = db.prepare("SELECT sql FROM sqlite_master WHERE name = ?").get(t.name);
  console.log(sql.sql + '\n');
});

console.log('\n--- 3. EXCEL FILE SAMPLES ---');
const importDir = './imports/';
const files = fs.readdirSync(importDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xlsm'));
files.forEach(f => {
  console.log('\n===== ' + f + ' =====');
  try {
    const wb = XLSX.read(fs.readFileSync(importDir + f), {type:'buffer'});
    console.log('Sheets:', wb.SheetNames);
    wb.SheetNames.slice(0,1).forEach(s => {
      const data = XLSX.utils.sheet_to_json(wb.Sheets[s], {header:1});
      console.log('--- ' + s + ' (' + data.length + ' rows) ---');
      for(let i=0; i<Math.min(10, data.length); i++) console.log(JSON.stringify(data[i]));
    });
  } catch(e) { console.log('ERR:', e.message); }
});
