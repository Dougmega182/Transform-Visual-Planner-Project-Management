import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'transform.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_fronts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      "order" INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT,
      team TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      front_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      zone TEXT,
      status TEXT DEFAULT 'not-started',
      priority TEXT DEFAULT 'medium',
      percent_complete INTEGER DEFAULT 0,
      date TEXT, -- Maps to plannedStart / startDate
      planned_end TEXT,
      actual_start TEXT,
      actual_end TEXT,
      assignee TEXT,
      trade TEXT,
      crew_count INTEGER DEFAULT 1,
      dependencies_json TEXT DEFAULT '[]',
      comments_json TEXT DEFAULT '[]',
      constraints_json TEXT DEFAULT '[]',
      stage TEXT DEFAULT 'construction',
      rag TEXT DEFAULT 'green',
      FOREIGN KEY(front_id) REFERENCES site_fronts(id)
    );

    CREATE TABLE IF NOT EXISTS constraints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      severity TEXT DEFAULT 'low',
      status TEXT DEFAULT 'open',
      front_name TEXT,
      raised_date TEXT,
      owner TEXT
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      role TEXT,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS staff_leave (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      type TEXT,
      FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_task_id INTEGER NOT NULL,
      to_task_id INTEGER NOT NULL,
      type TEXT DEFAULT 'finish_to_start',
      FOREIGN KEY(from_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY(to_task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);
}

export default getDb();
