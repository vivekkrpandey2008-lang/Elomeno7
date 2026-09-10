const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'fuck_you_admin';

// ---------- Database setup ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')
    ? { rejectUnauthorized: false }
    : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      roll TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      subject TEXT NOT NULL,
      text TEXT NOT NULL,
      options TEXT[] NOT NULL,
      correct_index INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
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
  console.log('Database ready.');
}

function checkPasscode(req, res, next) {
  const passcode = req.body.passcode || req.query.passcode || req.headers['x-admin-passcode'];
  if (passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'Galat admin passcode.' });
  }
  next();
}

// ---------- Auth ----------
app.post('/api/signup', async (req, res) => {
  const { name, roll } = req.body;
  if (!name || !roll) return res.status(400).json({ error: 'Naam aur roll number dono zaroori hai.' });
  try {
    const existing = await pool.query('SELECT * FROM users WHERE roll = $1', [roll.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Yeh roll number pehle se register hai. Login karein.' });
    }
    await pool.query('INSERT INTO users (roll, name) VALUES ($1, $2)', [roll.trim(), name.trim()]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error. Dobara try karein.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { name, roll } = req.body;
  if (!name || !roll) return res.status(400).json({ error: 'Naam aur roll number dono zaroori hai.' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE roll = $1', [roll.trim()]);
    const user = result.rows[0];
    if (!user || user.name.toLowerCase() !== name.trim().toLowerCase()) {
      return res.status(401).json({ error: 'Details match nahi hui. Pehle sign up karein ya sahi details daalein.' });
    }
    res.json({ ok: true, user: { name: user.name, roll: user.roll } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error. Dobara try karein.' });
  }
});

// ---------- Admin gate ----------
app.post('/api/admin/verify', (req, res) => {
  const { passcode } = req.body;
  if (passcode !== ADMIN_PASSCODE) return res.status(401).json({ error: 'Galat passcode.' });
  res.json({ ok: true });
});

// ---------- Questions ----------
app.get('/api/questions/:subject', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, text, options, correct_index AS "correctIndex" FROM questions WHERE subject = $1 ORDER BY id ASC',
      [req.params.subject]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Bulk add (admin only)
app.post('/api/questions/:subject', checkPasscode, async (req, res) => {
  const { questions } = req.body; // [{text, options:[4], correctIndex}]
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Koi valid question nahi mila.' });
  }
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const q of questions) {
        await client.query(
          'INSERT INTO questions (subject, text, options, correct_index) VALUES ($1, $2, $3, $4)',
          [req.params.subject, q.text, q.options, q.correctIndex]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    res.json({ ok: true, added: questions.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete one question (admin only)
app.delete('/api/questions/:subject/:id', checkPasscode, async (req, res) => {
  try {
    await pool.query('DELETE FROM questions WHERE id = $1 AND subject = $2', [req.params.id, req.params.subject]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Clear all questions for a subject (admin only)
app.delete('/api/questions/:subject', checkPasscode, async (req, res) => {
  try {
    await pool.query('DELETE FROM questions WHERE subject = $1', [req.params.subject]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ---------- Results ----------
app.get('/api/results', async (req, res) => {
  try {
    const subject = req.query.subject;
    const result = subject
      ? await pool.query('SELECT roll, name, subject, score, total, created_at AS "timestamp" FROM results WHERE subject = $1 ORDER BY score DESC', [subject])
      : await pool.query('SELECT roll, name, subject, score, total, created_at AS "timestamp" FROM results ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/results', async (req, res) => {
  const { roll, name, subject, score, total } = req.body;
  if (!roll || !name || !subject || score == null || total == null) {
    return res.status(400).json({ error: 'Result data incomplete hai.' });
  }
  try {
    await pool.query(
      'INSERT INTO results (roll, name, subject, score, total) VALUES ($1, $2, $3, $4, $5)',
      [roll, name, subject, score, total]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Fallback to index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
