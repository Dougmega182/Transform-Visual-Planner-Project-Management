import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'transform.db');

export function seedEssentialData() {
  console.log('SEED: No generic fronts to seed. Sync with your Excel schedules to populate the board.');
}

// Auto-run if this file is executed directly (though usually called from database.ts)
if (require.main === module) {
  seedEssentialData();
}
