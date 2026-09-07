const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "peer-tutor.db");

let db = null;

async function getDb() {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA foreign_keys = ON");
  return db;
}

// Save database to disk after mutations
function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

async function initDatabase() {
  const database = await getDb();

  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      university TEXT NOT NULL,
      department TEXT NOT NULL,
      year_of_study INTEGER DEFAULT 1,
      bio TEXT,
      role TEXT NOT NULL DEFAULT 'STUDENT',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS tutor_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      hourly_rate REAL DEFAULT 0,
      avg_rating REAL DEFAULT 0,
      total_reviews INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      subjects TEXT NOT NULL DEFAULT '',
      bio TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tutor_profile_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profiles(id) ON DELETE CASCADE
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      tutor_id INTEGER NOT NULL,
      tutor_profile_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      status TEXT NOT NULL DEFAULT 'PENDING',
      total_cost REAL DEFAULT 0,
      notes TEXT,
      cancel_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (tutor_id) REFERENCES users(id),
      FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profiles(id)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER UNIQUE NOT NULL,
      reviewer_id INTEGER NOT NULL,
      tutor_profile_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profiles(id)
    )
  `);

  saveDb();
  console.log("Database initialised.");
}

// Helper: run a query and return all rows
function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query and return first row
function dbGet(sql, params = []) {
  const rows = dbAll(sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

// Helper: run an insert and return lastInsertRowid
function dbRun(sql, params = []) {
  db.run(sql, params);
  const result = db.exec("SELECT last_insert_rowid() AS id");
  const rowId = result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] : 0;
  saveDb();
  return { lastInsertRowid: rowId, changes: db.getRowsModified() };
}

// Helper: run a statement (no return)
function dbExec(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

module.exports = { getDb, initDatabase, dbAll, dbGet, dbRun, dbExec, saveDb };
