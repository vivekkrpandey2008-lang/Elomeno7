const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'Elomeno7@2026';

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com')
    ? { rejectUnauthorized: false }
    : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      roll TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS subjects (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📚',
      description TEXT DEFAULT 'Practice test',
      duration_seconds INT DEFAULT 30,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      subject TEXT NOT NULL REFERENCES subjects(slug) ON DELETE CASCADE,
      text TEXT NOT NULL,
      options TEXT[] NOT NULL,
      correct_index INT NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS results (
      id SERIAL PRIMARY KEY,
      roll TEXT NOT NULL,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      score INT NOT NULL,
      total INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const defaults = [
    ['mathematics', 'Mathematics', '∑', 'Algebra, calculus & problem solving', 30],
    ['biology', 'Biology', '🧬', 'Life science & human biology', 30],
    ['english', 'English', 'Aa', 'Grammar, vocabulary & comprehension', 30],
    ['computer-science', 'Computer Science', '⌘', 'Programming & computer fundamentals', 30],
    ['general-knowledge', 'General Knowledge', '✦', 'Mixed knowledge practice', 30],
  ];
  for (const s of defaults) {
    await pool.query(
      `INSERT INTO subjects (slug,name,icon,description,duration_seconds)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (slug) DO NOTHING`,
      s
    );
  }
  console.log('Database ready.');
}

function checkPasscode(req, res, next) {
  const passcode = req.body.passcode || req.query.passcode || req.headers['x-admin-passcode'];
  if (passcode !== ADMIN_PASSCODE) return res.status(401).json({ error: 'Invalid admin passcode.' });
  next();
}

app.post('/api/admin/verify', checkPasscode, (req, res) => res.json({ ok: true }));

// ---------- Auth ----------
app.post('/api/signup', async (req, res) => {
  const { name, roll } = req.body;
  if (!name?.trim() || !roll?.trim()) return res.status(400).json({ error: 'Name and roll number are required.' });
  try {
    const existing = await pool.query('SELECT roll FROM users WHERE roll = $1', [roll.trim()]);
    if (existing.rows.length) return res.status(409).json({ error: 'This roll number is already registered.' });
    await pool.query('INSERT INTO users (roll, name) VALUES ($1,$2)', [roll.trim(), name.trim()]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error. Please try again.' }); }
});

app.post('/api/login', async (req, res) => {
  const { name, roll } = req.body;
  if (!name?.trim() || !roll?.trim()) return res.status(400).json({ error: 'Name and roll number are required.' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE roll = $1', [roll.trim()]);
    const user = result.rows[0];
    if (!user || user.name.toLowerCase() !== name.trim().toLowerCase()) {
      return res.status(401).json({ error: 'Details did not match. Please check your name and roll number.' });
    }
    res.json({ ok: true, user: { name: user.name, roll: user.roll } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error.' }); }
});

// ---------- Subjects ----------
app.get('/api/subjects', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.slug, s.name, s.icon, s.description, s.duration_seconds AS "durationSeconds",
             COUNT(q.id)::int AS "questionCount"
      FROM subjects s
      LEFT JOIN questions q ON q.subject = s.slug
      GROUP BY s.slug
      ORDER BY s.created_at ASC, s.name ASC
    `);
    res.json(result.rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load subjects.' }); }
});

app.post('/api/subjects', checkPasscode, async (req, res) => {
  const { slug, name, icon = '📚', description = 'Practice test', durationSeconds = 30 } = req.body;
  const cleanSlug = String(slug || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
  if (!cleanSlug || !name?.trim()) return res.status(400).json({ error: 'Subject name and a valid slug are required.' });
  try {
    await pool.query(
      `INSERT INTO subjects (slug,name,icon,description,duration_seconds) VALUES ($1,$2,$3,$4,$5)`,
      [cleanSlug, name.trim(), String(icon).slice(0, 8), description.trim(), Math.max(10, Number(durationSeconds) || 30)]
    );
    res.json({ ok: true });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'A subject with this slug already exists.' });
    console.error(e); res.status(500).json({ error: 'Could not create subject.' });
  }
});

app.delete('/api/subjects/:subject', checkPasscode, async (req, res) => {
  try {
    await pool.query('DELETE FROM subjects WHERE slug = $1', [req.params.subject]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not delete subject.' }); }
});

// ---------- Questions ----------
app.get('/api/questions/:subject', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id,text,options,correct_index AS "correctIndex"
       FROM questions WHERE subject=$1 ORDER BY id ASC`,
      [req.params.subject]
    );
    res.json(result.rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load questions.' }); }
});

app.post('/api/questions/:subject', checkPasscode, async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || !questions.length) return res.status(400).json({ error: 'No valid questions found.' });
  try {
    const subjectExists = await pool.query('SELECT 1 FROM subjects WHERE slug=$1', [req.params.subject]);
    if (!subjectExists.rows.length) return res.status(404).json({ error: 'Subject not found.' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const q of questions) {
        if (!q.text || !Array.isArray(q.options) || q.options.length !== 4 ||
            !q.options.every(Boolean) || !Number.isInteger(q.correctIndex) ||
            q.correctIndex < 0 || q.correctIndex > 3) {
          throw new Error('Every question needs text, exactly 4 options and a correct option from 1-4.');
        }
        await client.query(
          `INSERT INTO questions (subject,text,options,correct_index) VALUES ($1,$2,$3,$4)`,
          [req.params.subject, q.text.trim(), q.options.map(String), q.correctIndex]
        );
      }
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
    res.json({ ok: true, added: questions.length });
  } catch (e) { console.error(e); res.status(400).json({ error: e.message || 'Could not add questions.' }); }
});

app.delete('/api/questions/:subject/:id', checkPasscode, async (req, res) => {
  try {
    await pool.query('DELETE FROM questions WHERE id=$1 AND subject=$2', [req.params.id, req.params.subject]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not delete question.' }); }
});

app.delete('/api/questions/:subject', checkPasscode, async (req, res) => {
  try {
    await pool.query('DELETE FROM questions WHERE subject=$1', [req.params.subject]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not clear questions.' }); }
});

// ---------- Results ----------
app.get('/api/results', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id,r.roll,r.name,r.subject,r.score,r.total,r.created_at AS "timestamp",
             COALESCE(s.name,r.subject) AS "subjectName"
      FROM results r LEFT JOIN subjects s ON s.slug=r.subject
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load results.' }); }
});

app.post('/api/results', async (req, res) => {
  const { roll, name, subject, score, total } = req.body;
  if (!roll || !name || !subject || score == null || total == null) {
    return res.status(400).json({ error: 'Result data is incomplete.' });
  }
  try {
    await pool.query(
      `INSERT INTO results (roll,name,subject,score,total) VALUES ($1,$2,$3,$4,$5)`,
      [roll, name, subject, Number(score), Number(total)]
    );
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not save result.' }); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

initDb()
  .then(() => app.listen(PORT, () => console.log(`Elomeno7 Study Portal running on port ${PORT}`)))
  .catch(err => { console.error('Failed to initialize database:', err); process.exit(1); });
