# Elomeno7 Study — Test Portal

A redesigned, multi-subject online MCQ test portal using Node + Express + PostgreSQL.

## What's new

- Rebranded from the old Physics/Chemistry-only UI to **Elomeno7 Study**.
- Subjects are dynamic — admin can add subjects such as Mathematics, Biology, English, Economics, Computer Science, etc.
- Modern responsive UI for mobile and desktop.
- Student dashboard with subject search and question counts.
- Per-question timer and question map/palette.
- Cleaner test experience with progress indicator.
- Result screen with percentage, correct/wrong/total.
- Admin panel for:
  - adding/deleting subjects
  - uploading bulk MCQs
  - deleting individual questions
  - clearing a subject's questions
  - viewing/filtering student results
- PostgreSQL schema now includes a `subjects` table.
- Admin passcode accepts the Render `ADMIN_PASSCODE` value; for recovery/testing, fallback is `Elomeno7@1234`. For production, set a strong `ADMIN_PASSCODE` and remove/change the fallback in your own deployment if desired.
- Fixed the old fallback path so the root `index.html` is served correctly.

## Run locally

```bash
npm install
ADMIN_PASSCODE=your-secret DATABASE_URL=your-postgres-url npm start
```

Open `http://localhost:3000`.

## Render

Keep the same general deployment flow:
- Build command: `npm install`
- Start command: `node server.js`
- Environment variables:
  - `DATABASE_URL`
  - `ADMIN_PASSCODE`

The PostgreSQL database is initialized automatically on startup.

## Bulk question format

Use 6 lines per question, then a blank line:

Question text
Option 1
Option 2
Option 3
Option 4
Correct option number (1-4)

Example:

What is 2 + 2?
3
4
5
6
2
