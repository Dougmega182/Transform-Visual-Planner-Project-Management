const Database = require('better-sqlite3');
const db = new Database('./transform.db');

console.log('--- Deduplicating Projects ---');

// 1. Get all projects
const allFronts = db.prepare('SELECT * FROM site_fronts').all();
const uniqueMap = new Map(); // name -> id

allFronts.forEach(f => {
  const name = f.name.trim();
  if (!uniqueMap.has(name)) {
    uniqueMap.set(name, f.id);
  } else {
    const originalId = uniqueMap.get(name);
    console.log(`Merging duplicate project: "${name}" (ID ${f.id} -> ${originalId})`);
    
    // Move tasks to the original project
    db.prepare('UPDATE tasks SET front_id = ? WHERE front_id = ?').run(originalId, f.id);
    
    // Delete the duplicate project
    db.prepare('DELETE FROM site_fronts WHERE id = ?').run(f.id);
  }
});

console.log('\n--- Removing Projects with No Tasks ---');
const frontsWithTasks = db.prepare('SELECT DISTINCT front_id FROM tasks WHERE front_id IS NOT NULL').all();
const activeIds = frontsWithTasks.map(f => f.front_id);

const allRemaining = db.prepare('SELECT id, name FROM site_fronts').all();
allRemaining.forEach(f => {
  if (!activeIds.includes(f.id)) {
    console.log(`Deleting empty project: "${f.name}" (ID ${f.id})`);
    db.prepare('DELETE FROM site_fronts WHERE id = ?').run(f.id);
  }
});

console.log('\nClean up complete.');
