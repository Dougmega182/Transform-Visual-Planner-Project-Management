import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'transform.db');

export function seedEssentialData() {
  const db = new Database(DB_PATH);
  
  try {
    // Check if fronts already exist
    const count = db.prepare('SELECT COUNT(*) as count FROM site_fronts').get() as any;
    
    if (count.count === 0) {
      console.log('SEED: Seeding essential Site Fronts...');
      const insertFront = db.prepare('INSERT INTO site_fronts (name, "order") VALUES (?, ?)');
      insertFront.run('Front A – Main Building', 1);
      insertFront.run('Front B – Parking Structure', 2);
      insertFront.run('Front C – Landscaping', 3);
      insertFront.run('Front D – Services', 4);
      console.log('SEED: Essential data seeded.');
    } else {
      console.log('SEED: Site fronts already exist, skipping essential seed.');
    }
  } catch (err) {
    console.error('SEED ERROR:', err);
  } finally {
    db.close();
  }
}

// Auto-run if this file is executed directly (though usually called from database.ts)
if (require.main === module) {
  seedEssentialData();
}
