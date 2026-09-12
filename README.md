# Elomeno7 Study — Test Portal

A multi-subject online MCQ test portal built with Node + Express + PostgreSQL.

## v3 — what's new

**Design**
- Full visual redesign: warm paper/ink theme with Fraunces + Inter type, replacing the old generic purple-gradient look.
- Light/dark theme toggle (saved per browser).
- Cleaner component styling throughout — no more ad-hoc inline styles.

**New features** (each lives in its own small file, loaded alongside `app.js`)
- `theme.js` — light/dark mode toggle.
- `progress.js` — a "My Progress" tab on the student dashboard: tests taken, average/best score, and a visual history of every attempt.
- `analytics.js` — an "Analytics" tab in the admin panel: total attempts, active students, subject-wise average scores, and a top-5 leaderboard.
- `export.js` — "Export CSV" button on the admin results table.
- `certificate.js` — "Download certificate" button on the result screen; opens a printable completion certificate.

**Backend**
- New endpoint `GET /api/results/:roll` so a student can fetch their own result history (used by "My Progress").
- Everything else — signup/login, dynamic subjects, bulk question upload, timed quiz delivery, results storage — is unchanged from the existing schema, so no migration is needed.

## Subjects

Subjects are fully dynamic — add, rename, or remove any subject (Physics, Chemistry, Mathematics, Biology, English, Computer Science, whatever you need) from the admin panel. There's no hardcoded subject list in the UI.

## Run locally

```bash
npm install
ADMIN_PASSCODE=your-secret DATABASE_URL=your-postgres-url npm start
```

Open `http://localhost:3000`.

## Render deployment

Same as before:
- Build command: `npm install`
- Start command: `node server.js`
- Environment variables: `DATABASE_URL`, `ADMIN_PASSCODE`

The database schema initializes automatically on startup — your existing data is preserved, the new endpoint just reads from the existing `results` table.

## Bulk question format

Six lines per question, then a blank line:

```
Question text
Option 1
Option 2
Option 3
Option 4
Correct option number (1-4)
```

Example:

```
What is 2 + 2?
3
4
5
6
2
```
