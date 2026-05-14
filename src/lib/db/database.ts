import Database from 'better-sqlite3';
import path from 'path';
import { seedEssentialData } from './seed';

const DB_PATH = path.join(process.cwd(), 'transform.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
    seedEssentialData();
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
      trade TEXT,
      type TEXT DEFAULT 'in-house', -- 'in-house' or 'subcontractor'
      daily_cost REAL DEFAULT 0,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS resource_pool (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trade TEXT NOT NULL,           -- 'Carpenter', 'Labourer', 'Electrician'
      source TEXT NOT NULL,          -- 'in-house' | 'subcontractor'
      company_name TEXT,             -- NULL for in-house
      total_capacity INTEGER NOT NULL,
      effective_from DATE NOT NULL,
      effective_until DATE,          -- NULL = indefinite
      daily_cost REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS upcoming_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      source_file TEXT NOT NULL,
      status TEXT DEFAULT 'tentative', -- 'tentative', 'committed', 'rejected'
      projected_start DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS upcoming_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES upcoming_projects(id),
      trade TEXT NOT NULL,
      crew_needed INTEGER NOT NULL,
      duration_days INTEGER NOT NULL,
      sequence_order INTEGER DEFAULT 0
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
      duration INTEGER DEFAULT 1,
      planned_end TEXT,
      actual_start TEXT,
      actual_end TEXT,
      assignee TEXT,
      trade TEXT,
      crew_count INTEGER DEFAULT 1,
      subcontractor TEXT,
      hours_per_day REAL DEFAULT 8.0,
      equipment_needs TEXT,
      weather_sensitivity INTEGER DEFAULT 0, -- 0 = False, 1 = True
      cost_rate REAL DEFAULT 0,
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
