import { getDb } from './database';

const db = getDb();

// 1. Clear existing
db.exec('DELETE FROM site_fronts');
db.exec('DELETE FROM staff');
db.exec('DELETE FROM tasks');
db.exec('DELETE FROM constraints');

// 2. Seed Fronts
const insertFront = db.prepare('INSERT INTO site_fronts (id, name, "order") VALUES (?, ?, ?)');
insertFront.run(1, 'Front A – Main Building', 1);
insertFront.run(2, 'Front B – Parking Structure', 2);
insertFront.run(3, 'Front C – Landscaping', 3);
insertFront.run(4, 'Front D – Services', 4);

// 3. Seed Staff
const insertStaff = db.prepare('INSERT INTO staff (id, name, role, team) VALUES (?, ?, ?, ?)');
insertStaff.run(1, 'Ahmed Al-Rashid', 'Site Engineer', 'Team Alpha');
insertStaff.run(2, 'Sarah Chen', 'Project Manager', 'Admin');
insertStaff.run(3, 'James Okafor', 'QS', 'Team Beta');
insertStaff.run(4, 'Maria Santos', 'Safety Officer', 'HSE');

// 4. Seed Tasks
const insertTask = db.prepare(`
  INSERT INTO tasks (
    id, front_id, title, description, zone, status, priority, 
    percent_complete, date, planned_end, assignee, trade, crew_count, stage
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertTask.run(
  1, 1, 'Level 3 Slab Pour – Zone A', 
  'Complete concrete pour for Level 3 suspended slab. Includes post-tension cables and MEP sleeves.',
  'Zone A – East Wing', 'in-progress', 'critical', 65,
  '2025-01-06', '2025-01-10', 'Ahmed Al-Rashid', 'Concrete', 12, 'construction'
);

insertTask.run(
  2, 1, 'L3 Formwork – Zone B', 
  'Install deck formwork and edge shutters for Zone B.',
  'Zone B', 'not-started', 'high', 0,
  '2025-01-11', '2025-01-15', 'James Okafor', 'Formwork', 8, 'construction'
);

// 5. Seed Constraints
const insertConstraint = db.prepare(`
  INSERT INTO constraints (id, title, description, severity, status, front_name, raised_date, owner)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

insertConstraint.run(
  1, 'RFI #042 – Slab reinforcement clash',
  'Structural clash between MEP penetrations and post-tension cables at Level 3.',
  'critical', 'open', 'Front A – Main Building', '2025-01-06', 'Ahmed Al-Rashid'
);

console.log('Database seeded successfully!');
