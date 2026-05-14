import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { getDb } from '@/lib/db/database';

const ROOT = path.resolve(process.cwd());

// Your internal staff with known roles/trades
const INTERNAL_STAFF_OVERRIDES: Record<string, { role: string; trade: string; capacity: number }> = {
  'Matt Reid': { role: 'Site Supervisor', trade: 'Supervision', capacity: 1 },
  'Oliver Trifunovski': { role: 'Site Supervisor', trade: 'Supervision', capacity: 1 },
  'James Quinn': { role: 'Leading Hand', trade: 'Carpentry', capacity: 1 },
  'Lachlan Findlay': { role: 'Leading Hand', trade: 'Carpentry', capacity: 1 },
  'Jesse Kendal': { role: 'Carpenter', trade: 'Carpentry', capacity: 1 },
  'Vaughan Haynes-Spence': { role: 'Carpenter', trade: 'Carpentry', capacity: 1 },
  'Zac White': { role: 'Carpenter', trade: 'Carpentry', capacity: 1 },
  'Tavis King': { role: 'Labourer', trade: 'General', capacity: 1 },
  'John Bainbridge': { role: 'Labourer', trade: 'General', capacity: 1 },
};

export function ensureResourcesTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'subcontractor',
      trade TEXT DEFAULT '',
      role TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      cell TEXT DEFAULT '',
      daily_cost REAL DEFAULT 0,
      capacity INTEGER DEFAULT 1,
      is_preferred INTEGER DEFAULT 0,
      usage_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      liability_expiry TEXT DEFAULT '',
      workers_comp_expiry TEXT DEFAULT '',
      trade_agreement TEXT DEFAULT '',
      activation TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function parseExcelDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(val);
      if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    } catch { /* fall through */ }
  }
  return String(val).trim();
}

function normalizeHeader(h: any): string {
  return String(h || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
}

// ─── SUBCONTRACTORS ───────────────────────────────────────────────

export function importSubcontractors(): { imported: number; skipped: number; errors: string[] } {
  const filePath = path.join(ROOT, 'Subs (1).xlsx');
  const result = { imported: 0, skipped: 0, errors: [] as string[] };

  if (!fs.existsSync(filePath)) {
    result.errors.push('Subs (1).xlsx not found in project root');
    console.log('[Resources] Subs file not found at:', filePath);
    return result;
  }

  const db = getDb();
  ensureResourcesTable();

  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  // Based on inspection: Row 0 is Metadata, Row 1 is Headers, Row 2 is Data
  if (raw.length < 3) {
    result.errors.push('Subs file has no data rows');
    return result;
  }

  const headers = raw[1].map(normalizeHeader);
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => { colMap[h] = i; });

  console.log('[Resources] Subs columns:', headers);

  const upsert = db.prepare(`
    INSERT INTO resources (name, type, trade, role, phone, cell, activation, trade_agreement, liability_expiry, workers_comp_expiry, capacity)
    VALUES (?, 'subcontractor', ?, ?, ?, ?, ?, ?, ?, ?, 4)
    ON CONFLICT(name) DO UPDATE SET
      trade = excluded.trade,
      role = excluded.role,
      phone = excluded.phone,
      cell = excluded.cell,
      activation = excluded.activation,
      trade_agreement = excluded.trade_agreement,
      liability_expiry = excluded.liability_expiry,
      workers_comp_expiry = excluded.workers_comp_expiry
  `);

  const getCol = (row: any[], key: string): string => {
    const idx = colMap[key];
    return idx !== undefined ? String(row[idx] || '').trim() : '';
  };

  const insertMany = db.transaction(() => {
    for (let i = 2; i < raw.length; i++) {
      const row = raw[i];
      if (!row || !row[0]) { result.skipped++; continue; }

      const company = String(row[colMap['company']] || '').trim();
      if (!company) { result.skipped++; continue; }

      try {
        upsert.run(
          company,
          getCol(row, 'division'),
          getCol(row, 'primary_contact'), 
          getCol(row, 'phone'),
          getCol(row, 'cell'),
          getCol(row, 'activation'),
          getCol(row, 'trade_agreement_status'),
          parseExcelDate(row[colMap['liability_exp_']]),
          parseExcelDate(row[colMap['worker_s_comp_exp_']])
        );
        result.imported++;
      } catch (err: any) {
        result.errors.push(`Row ${i} (${company}): ${err.message}`);
      }
    }
  });
  insertMany();
  console.log(`[Resources] Subs: ${result.imported} imported, ${result.skipped} skipped, ${result.errors.length} errors`);
  return result;
}

// ─── INTERNAL STAFF ───────────────────────────────────────────────

export function importInternalStaff(): { imported: number; skipped: number; errors: string[] } {
  const filePath = path.join(ROOT, 'Users.xlsx');
  const result = { imported: 0, skipped: 0, errors: [] as string[] };

  if (!fs.existsSync(filePath)) {
    result.errors.push('Users.xlsx not found in project root');
    console.log('[Resources] Users file not found at:', filePath);
    return result;
  }

  const db = getDb();
  ensureResourcesTable();

  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  // Based on inspection: Row 0 is Metadata, Row 1 is Headers, Row 2 is Data
  if (raw.length < 3) {
    result.errors.push('Users file has no data rows');
    return result;
  }

  const headers = raw[1].map(normalizeHeader);
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => { colMap[h] = i; });

  console.log('[Resources] Users columns:', headers);

  const upsert = db.prepare(`
    INSERT INTO resources (name, type, trade, role, email, phone, capacity)
    VALUES (?, 'internal_staff', ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      type = 'internal_staff',
      trade = excluded.trade,
      role = excluded.role,
      email = excluded.email,
      phone = excluded.phone,
      capacity = excluded.capacity
  `);

  const getCol = (row: any[], key: string): string => {
    const idx = colMap[key];
    return idx !== undefined ? String(row[idx] || '').trim() : '';
  };

  const insertMany = db.transaction(() => {
    for (let i = 2; i < raw.length; i++) {
      const row = raw[i];
      if (!row || !row[0]) { result.skipped++; continue; }

      const name = String(row[colMap['name']] || '').trim();
      if (!name) { result.skipped++; continue; }

      // Check if we have a manual override for this person
      const override = INTERNAL_STAFF_OVERRIDES[name];
      const xlsRole = getCol(row, 'role');
      const trade = override ? override.trade : xlsRole;
      const role = override ? override.role : xlsRole;
      const capacity = override ? override.capacity : 1;

      try {
        upsert.run(
          name,
          trade,
          role,
          getCol(row, 'email'),
          getCol(row, 'phone'),
          capacity
        );
        result.imported++;
      } catch (err: any) {
        result.errors.push(`Row ${i} (${name}): ${err.message}`);
      }
    }
  });

  insertMany();
  console.log(`[Resources] Staff: ${result.imported} imported, ${result.skipped} skipped, ${result.errors.length} errors`);
  return result;
}

// ─── SMART MATCH ──────────────────────────────────────────────────

export function findBestResource(trade: string, type?: string): { name: string; id: number } | null {
  const db = getDb();
  ensureResourcesTable();

  if (!trade) return null;

  let query = `
    SELECT id, name FROM resources
    WHERE trade LIKE ? AND status = 'active'
  `;
  const params: any[] = [`%${trade}%`];

  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }

  query += ` ORDER BY is_preferred DESC, usage_score DESC LIMIT 1`;

  const row = db.prepare(query).get(...params) as { id: number; name: string } | undefined;
  return row || null;
}

export function incrementUsageScore(resourceId: number) {
  const db = getDb();
  db.prepare(`UPDATE resources SET usage_score = usage_score + 1 WHERE id = ?`).run(resourceId);
}

// ─── FULL SYNC ────────────────────────────────────────────────────

export function syncAllResources(): {
  subs: { imported: number; skipped: number; errors: string[] };
  staff: { imported: number; skipped: number; errors: string[] };
  totalResources: number;
} {
  ensureResourcesTable();
  const subs = importSubcontractors();
  const staff = importInternalStaff();

  const db = getDb();
  const count = db.prepare(`SELECT COUNT(*) as total FROM resources`).get() as { total: number };

  console.log(`[Resources] Sync complete. Total resources in DB: ${count.total}`);

  return {
    subs,
    staff,
    totalResources: count.total
  };
}
