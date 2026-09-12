const $ = s => document.querySelector(s);
const app = $('#app');
const API = '';
const state = {
  screen: 'landing', user: null, subjects: [], questions: [], subject: null, idx: 0,
  selected: [], timeLeft: [], timer: null, score: 0, adminPass: null, adminTab: 'subjects',
  adminSubject: null, adminQuestions: [], results: [], resultFilter: '', search: '',
  dashTab: 'practice', myResults: []
};

async function api(url, options = {}) {
  const r = await fetch(API + url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
const slugify = s => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function stopTimer() { if (state.timer) { clearInterval(state.timer); state.timer = null; } }
function toast(msg) { const x = document.createElement('div'); x.className = 'toast'; x.textContent = msg; document.body.appendChild(x); setTimeout(() => x.remove(), 2500); }

function render() {
  stopTimer();
  const views = { landing, signup: authSignup, login: authLogin, dashboard, test, result, adminGate, admin };
  app.innerHTML = views[state.screen]();
  bind();
}
function logo() { return `<div class="logo"><div class="logo-mark">E7</div><span>Elomeno<b>7</b> Study</span></div>`; }

function landing() {
  return `<div class="hero">
   <div class="topbar">${logo()}<div class="topbar-actions">${Theme.button(true)}<button class="btn btn-outline-invert" id="adminBtn">Admin</button></div></div>
   <div class="hero-main container">
     <div>
       <span class="kicker">Practice · Track · Improve</span>
       <h1>Prepare with purpose.<br>Test like it's <em>the real exam.</em></h1>
       <p class="hero-copy">Elomeno7 Study is a focused test portal for students — pick a subject, sit a timed practice test, and watch your scores build into real progress over time.</p>
       <div class="hero-actions"><button class="btn btn-primary" id="signupBtn">Get started</button><button class="btn btn-outline-invert" id="loginBtn">I already have an account</button></div>
       <div class="hero-stats"><div class="hero-stat"><b>${state.subjects.length || '—'}</b><span>Subjects available</span></div><div class="hero-stat"><b>MCQ</b><span>Practice format</span></div><div class="hero-stat"><b>24/7</b><span>Open access</span></div></div>
     </div>
     <div class="preview"><div class="preview-window"><div class="window-head"><i class="dot"></i><i class="dot"></i><i class="dot"></i></div><div class="mock-title">Your next test</div><div class="mock-muted">Pick a subject and start practicing.</div><div class="mock-card"><div style="display:flex;justify-content:space-between"><b>Mathematics</b><span>12 Qs</span></div><div class="mock-muted" style="margin:8px 0 13px">30 seconds per question</div><div class="mock-progress"><i></i></div><div class="mock-option active">A. Select the correct answer</div><div class="mock-option">B. Another option</div><div class="mock-option">C. One more option</div></div></div></div>
   </div><div class="trust">Built for focused practice · simple for students · easy for teachers to manage</div>
 </div>`;
}

function authShell(title, sub, fields, button, footer) {
  return `<div class="auth-page"><div class="auth-card"><button class="back" id="backHome">← Back to home</button><div class="auth-logo">${logo()}</div><h1>${title}</h1><p class="sub">${sub}</p>${state.error ? `<div class="msg error">${esc(state.error)}</div>` : ''}${state.info ? `<div class="msg success">${esc(state.info)}</div>` : ''}${fields}<button class="btn btn-primary btn-block" style="margin-top:8px" id="submitAuth">${button}</button><div style="text-align:center;margin-top:17px;font-size:13px;color:var(--text-dim)">${footer}</div></div></div>`;
}
function authSignup() {
  return authShell('Create your account', 'One-time registration. Use your name and roll number for future logins.',
    `<div class="field"><label>FULL NAME</label><input id="name" placeholder="e.g. Vivek Kumar"></div><div class="field"><label>ROLL NUMBER</label><input id="roll" placeholder="e.g. 01"></div>`,
    'Create account', `Already registered? <button class="btn-link" id="switchLogin">Login</button>`);
}
function authLogin() {
  return authShell('Welcome back', 'Enter your registered details to continue.',
    `<div class="field"><label>FULL NAME</label><input id="name" placeholder="e.g. Vivek Kumar"></div><div class="field"><label>ROLL NUMBER</label><input id="roll" placeholder="e.g. 01"></div>`,
    'Login', `New here? <button class="btn-link" id="switchSignup">Create account</button>`);
}

async function loadSubjects() { try { state.subjects = await api('/api/subjects'); } catch (e) { state.subjects = []; } }

function dashboard() {
  const filtered = state.subjects.filter(s => (s.name + ' ' + s.description).toLowerCase().includes(state.search.toLowerCase()));
  const body = state.dashTab === 'progress'
    ? Progress.render(state.myResults)
    : `<div class="search-row">⌕ <input class="search" id="search" value="${esc(state.search)}" placeholder="Search subjects..."><span class="count-pill">${filtered.length} available</span></div>
       <h2 class="section-title">All subjects</h2>${filtered.length ? `<div class="subject-grid">${filtered.map(subjectCard).join('')}</div>` : `<div class="empty">No subject matches your search.</div>`}`;

  return `<div class="page"><div class="nav-dark"><div class="nav-inner">${logo()}<div class="nav-actions"><span class="user-pill">${esc(state.user.name)} · ${esc(state.user.roll)}</span>${Theme.button(true)}<button class="btn btn-outline-invert" id="logout">Logout</button></div></div></div>
 <div class="dashboard-head"><div class="container"><div class="welcome">GOOD TO SEE YOU AGAIN</div><h1>Choose your subject.</h1><p>Practice at your own pace and keep improving.</p></div></div>
 <main class="container dashboard-body">
   <div class="toolbar">
     <button class="toolbar-tab ${state.dashTab === 'practice' ? 'active' : ''}" data-dash-tab="practice">Practice</button>
     <button class="toolbar-tab ${state.dashTab === 'progress' ? 'active' : ''}" data-dash-tab="progress">My Progress</button>
   </div>
   ${body}
 </main></div>`;
}
function subjectCard(s) { return `<article class="subject"><div class="subject-icon">${esc(s.icon)}</div><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p><div class="subject-meta"><span>${s.questionCount} questions</span><span>⏱ ${s.durationSeconds}s / Q</span></div><button class="btn btn-primary btn-block" data-start="${esc(s.slug)}" ${!s.questionCount ? 'disabled' : ''}>${s.questionCount ? 'Start test' : 'Coming soon'}</button></article>`; }

async function startTest(slug) {
  try {
    const qs = await api('/api/questions/' + encodeURIComponent(slug)); const sub = state.subjects.find(s => s.slug === slug);
    if (!qs.length) { toast('This subject has no questions yet.'); return; }
    state.subject = sub; state.questions = qs; state.idx = 0; state.selected = new Array(qs.length).fill(null); state.timeLeft = new Array(qs.length).fill(sub.durationSeconds || 30); state.screen = 'test'; render(); startTimer();
  } catch (e) { toast(e.message); }
}
function startTimer() { stopTimer(); state.timer = setInterval(() => { state.timeLeft[state.idx]--; if (state.timeLeft[state.idx] <= 0) { state.timeLeft[state.idx] = 0; goNext(true); } else updateTimer(); }, 1000); }
function updateTimer() { const x = $('#timer'); if (x) { x.textContent = `⏱ ${state.timeLeft[state.idx]}s`; x.classList.toggle('warn', state.timeLeft[state.idx] <= 10); } }
function test() {
  const q = state.questions[state.idx], total = state.questions.length, pct = Math.round((state.idx / total) * 100), done = state.selected.filter(x => x !== null).length;
  return `<div class="test-page"><header class="test-top"><div class="test-top-inner"><div class="test-row"><div><div class="test-subject">${esc(state.subject.icon)} ${esc(state.subject.name)}</div><div class="counter">Question ${state.idx + 1} of ${total} · ${done} answered</div></div><div id="timer" class="timer ${state.timeLeft[state.idx] <= 10 ? 'warn' : ''}">⏱ ${state.timeLeft[state.idx]}s</div></div><div class="bar"><i style="width:${pct}%"></i></div></div></header><main class="test-wrap"><div class="test-layout"><section class="question-card"><div class="question-label">QUESTION ${state.idx + 1}</div><div class="question">${esc(q.text)}</div>${q.options.map((o, i) => `<button class="option ${state.selected[state.idx] === i ? 'selected' : ''}" data-opt="${i}"><span class="letter">${String.fromCharCode(65 + i)}</span><span>${esc(o)}</span></button>`).join('')}<div class="test-actions"><button class="btn btn-outline" id="prev" ${state.idx === 0 ? 'disabled' : ''}>← Previous</button><button class="btn btn-primary" id="next">${state.idx === total - 1 ? 'Submit test' : 'Next →'}</button></div></section><aside class="palette-card"><div class="palette-title">QUESTION MAP</div><div class="palette">${state.questions.map((_, i) => `<button class="pbtn ${state.selected[i] !== null ? 'done' : ''} ${i === state.idx ? 'current' : ''}" data-q="${i}">${i + 1}</button>`).join('')}</div><div class="small" style="margin-top:13px">Amber = answered · Outline = current</div></aside></div></main></div>`;
}
function goNext(force = false) { if (!force && state.idx < state.questions.length - 1 && state.selected[state.idx] === null) { toast('Select an answer first.'); return; } if (state.idx === state.questions.length - 1) { submitTest(); return; } state.idx++; render(); startTimer(); }
function goPrev() { if (state.idx > 0) { state.idx--; render(); startTimer(); } }
async function submitTest() { stopTimer(); state.score = state.questions.reduce((n, q, i) => n + (state.selected[i] === q.correctIndex ? 1 : 0), 0); try { await api('/api/results', { method: 'POST', body: JSON.stringify({ roll: state.user.roll, name: state.user.name, subject: state.subject.slug, score: state.score, total: state.questions.length }) }); } catch (e) {} state.screen = 'result'; render(); }
function result() {
  const total = state.questions.length, pct = Math.round(state.score / total * 100);
  return `<div class="result-page"><div class="result-card"><div style="color:var(--text-dim);font-size:12px;font-weight:700">TEST COMPLETE</div><div class="score"><b>${pct}%</b><span>YOUR SCORE</span></div><h1>Nice work, ${esc(state.user.name)}!</h1><p class="sub" style="margin-bottom:0">${esc(state.subject.name)} practice test completed.</p><div class="result-stats"><div class="stat"><b style="color:var(--teal)">${state.score}</b><span>Correct</span></div><div class="stat"><b style="color:var(--danger)">${total - state.score}</b><span>Wrong</span></div><div class="stat"><b>${total}</b><span>Total</span></div></div><div class="result-actions"><button class="btn btn-outline btn-block" id="downloadCert">Download certificate</button><button class="btn btn-primary btn-block" id="backDash">Back to dashboard</button></div></div></div>`;
}

function adminGate() { return `<div class="auth-page"><div class="auth-card"><button class="back" id="backHome">← Back to home</button><div class="auth-logo">${logo()}</div><h1>Admin access</h1><p class="sub">Manage subjects, upload questions and review student results.</p>${state.error ? `<div class="msg error">${esc(state.error)}</div>` : ''}<div class="field"><label>ADMIN PASSCODE</label><input id="pass" type="password" placeholder="Enter passcode"></div><button class="btn btn-primary btn-block" id="adminLogin">Open admin panel</button></div></div>`; }

function admin() {
  const tabs = ['subjects', 'questions', 'results', 'analytics']; let body = '';
  if (state.adminTab === 'subjects') body = adminSubjects();
  if (state.adminTab === 'questions') body = adminQuestions();
  if (state.adminTab === 'results') body = adminResults();
  if (state.adminTab === 'analytics') body = Analytics.render(state.subjects, state.results);
  return `<div class="admin"><header class="admin-head"><div class="nav-inner">${logo()}<div class="nav-actions">${Theme.button(true)}<button class="btn btn-outline-invert" id="adminExit">Exit</button></div></div></header><main class="admin-main"><div class="admin-tabs">${tabs.map(t => `<button class="tab ${state.adminTab === t ? 'active' : ''}" data-tab="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>${body}</main></div>`;
}
function adminSubjects() { return `<div class="admin-grid"><section class="panel"><h2>Add a new subject</h2><div class="admin-form"><div class="field"><label>SUBJECT NAME</label><input id="sName" placeholder="e.g. Economics"></div><div class="field"><label>ICON</label><input id="sIcon" placeholder="📊" maxlength="4"></div><div class="field full"><label>DESCRIPTION</label><input id="sDesc" placeholder="Short description"></div><div class="field"><label>TIME / QUESTION (SECONDS)</label><input id="sTime" type="number" value="30" min="10"></div></div><button class="btn btn-primary btn-block" style="margin-top:8px" id="addSubject">Add subject</button><div class="hint">A slug is generated automatically. After adding a subject, open Questions to upload its MCQs.</div></section><section class="panel"><h2>Subjects</h2><div class="list">${state.subjects.map(s => `<div class="list-item"><div><b>${esc(s.icon)} ${esc(s.name)}</b><div class="small">${s.questionCount} questions · ${s.durationSeconds}s/Q</div></div><button class="btn btn-danger" data-delete-subject="${esc(s.slug)}">Delete</button></div>`).join('')}</div></section></div>`; }
function adminQuestions() { const s = state.subjects.find(x => x.slug === state.adminSubject) || state.subjects[0]; if (!s) return '<div class="empty">Add a subject first.</div>'; state.adminSubject = s.slug; return `<div class="panel"><div class="panel-head-row"><h2>Question manager</h2><select class="select" style="width:auto" id="subjectSelect">${state.subjects.map(x => `<option value="${esc(x.slug)}" ${x.slug === s.slug ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div><textarea id="bulk" rows="11" placeholder="Question text
Option 1
Option 2
Option 3
Option 4
Correct option number (1-4)

Leave one blank line between questions."></textarea><div class="hint"><b>Format:</b> 6 lines per question — question, 4 options, correct number. Separate questions with a blank line.</div><button class="btn btn-primary" style="margin-top:12px" id="addQuestions">Upload questions</button></div><div class="panel"><div class="panel-head-row"><h2>${state.adminQuestions.length} saved questions</h2>${state.adminQuestions.length ? '<button class="btn btn-danger" id="clearQuestions">Clear all</button>' : ''}</div><div class="list">${state.adminQuestions.map((q, i) => `<div class="list-item"><div><b>${i + 1}. ${esc(q.text)}</b><div class="small">Correct: ${esc(q.options[q.correctIndex])}</div></div><button class="btn btn-danger" data-delete-q="${q.id}">Delete</button></div>`).join('') || '<div class="empty">No questions yet.</div>'}</div></div>`; }
function adminResults() { const names = Object.fromEntries(state.subjects.map(s => [s.slug, s.name])); const filtered = state.results.filter(r => !state.resultFilter || r.subject === state.resultFilter); return `<div class="panel"><div class="panel-head-row"><h2>Student results</h2><div style="display:flex;gap:8px"><select class="select" style="width:auto" id="resultFilter"><option value="">All subjects</option>${state.subjects.map(s => `<option value="${esc(s.slug)}" ${s.slug === state.resultFilter ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select><button class="btn btn-outline" id="exportCsv">Export CSV</button></div></div><div style="overflow:auto"><table class="result-table"><thead><tr><th>Student</th><th>Subject</th><th>Score</th><th>Date</th></tr></thead><tbody>${filtered.map(r => `<tr><td><b>${esc(r.name)}</b><br><span class="small">Roll ${esc(r.roll)}</span></td><td>${esc(r.subjectName || names[r.subject] || r.subject)}</td><td><b>${r.score}/${r.total}</b> (${Math.round(r.score / r.total * 100)}%)</td><td>${new Date(r.timestamp).toLocaleString()}</td></tr>`).join('') || '<tr><td colspan="4">No results yet.</td></tr>'}</tbody></table></div></div>`; }

function parseBulk(raw) { const blocks = raw.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean), out = []; for (let i = 0; i < blocks.length; i++) { const lines = blocks[i].split('\n').map(x => x.trim()).filter(Boolean); if (lines.length < 6) throw new Error(`Block ${i + 1}: 6 lines required.`); const n = Number(lines[5]); if (![1, 2, 3, 4].includes(n)) throw new Error(`Block ${i + 1}: correct option must be 1-4.`); out.push({ text: lines[0], options: lines.slice(1, 5), correctIndex: n - 1 }); } return out; }

async function loadAdmin() { await loadSubjects(); try { state.results = await api('/api/results'); state.resultsError = ''; } catch (e) { state.results = []; state.resultsError = e.message || 'Results could not be loaded.'; } if (state.adminSubject) try { await loadAdminQuestions(); } catch (e) { state.adminQuestions = []; } render(); }
async function loadAdminQuestions() { if (!state.adminSubject) return; state.adminQuestions = await api('/api/questions/' + encodeURIComponent(state.adminSubject)); }

function bind() {
  $('#signupBtn')?.addEventListener('click', () => { state.screen = 'signup'; state.error = ''; state.info = ''; render(); });
  $('#loginBtn')?.addEventListener('click', () => { state.screen = 'login'; state.error = ''; state.info = ''; render(); });
  $('#adminBtn')?.addEventListener('click', () => { state.screen = 'adminGate'; state.error = ''; render(); });
  $('#backHome')?.addEventListener('click', () => { state.screen = 'landing'; state.error = ''; render(); });
  $('#switchLogin')?.addEventListener('click', () => { state.screen = 'login'; state.error = ''; render(); });
  $('#switchSignup')?.addEventListener('click', () => { state.screen = 'signup'; state.error = ''; render(); });
  $('#themeToggle')?.addEventListener('click', () => { Theme.toggle(); render(); });
  if ($('#submitAuth')) $('#submitAuth').addEventListener('click', async () => { const name = $('#name').value.trim(), roll = $('#roll').value.trim(); if (!name || !roll) { state.error = 'Please fill both fields.'; render(); return; } try { if (state.screen === 'signup') { await api('/api/signup', { method: 'POST', body: JSON.stringify({ name, roll }) }); state.screen = 'login'; state.info = 'Account created. Please login.'; state.error = ''; } else { const d = await api('/api/login', { method: 'POST', body: JSON.stringify({ name, roll }) }); state.user = d.user; state.screen = 'dashboard'; state.dashTab = 'practice'; state.error = ''; state.info = ''; await loadSubjects(); } render(); } catch (e) { state.error = e.message; render(); } });
  $('#logout')?.addEventListener('click', () => { state.user = null; state.screen = 'landing'; render(); });
  $('#search')?.addEventListener('input', e => { state.search = e.target.value; render(); $('#search')?.focus(); });
  document.querySelectorAll('[data-dash-tab]').forEach(b => b.addEventListener('click', async () => {
    state.dashTab = b.dataset.dashTab;
    if (state.dashTab === 'progress') { try { state.myResults = await Progress.load(state.user.roll); } catch (e) { state.myResults = []; } }
    render();
  }));
  document.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => startTest(b.dataset.start)));
  document.querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => { state.selected[state.idx] = Number(b.dataset.opt); render(); startTimer(); }));
  document.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { state.idx = Number(b.dataset.q); render(); startTimer(); }));
  $('#next')?.addEventListener('click', () => goNext()); $('#prev')?.addEventListener('click', goPrev); $('#backDash')?.addEventListener('click', () => { state.screen = 'dashboard'; render(); });
  $('#downloadCert')?.addEventListener('click', () => Certificate.open({ name: state.user.name, roll: state.user.roll, subject: state.subject.name, score: state.score, total: state.questions.length }));
  $('#adminLogin')?.addEventListener('click', async () => { try { const pass = $('#pass').value; await api('/api/admin/verify', { method: 'POST', body: JSON.stringify({ passcode: pass }) }); state.adminPass = pass; state.screen = 'admin'; state.adminTab = 'subjects'; state.adminSubject = null; await loadAdmin(); } catch (e) { state.error = e.message; render(); } });
  $('#adminExit')?.addEventListener('click', () => { state.adminPass = null; state.screen = 'landing'; render(); });
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', async () => { state.adminTab = b.dataset.tab; if (state.adminTab === 'results' || state.adminTab === 'analytics') { try { state.results = await api('/api/results'); state.resultsError = ''; } catch (e) { state.results = []; state.resultsError = e.message || 'Results could not be loaded.'; } } if (state.adminTab === 'questions') { if (!state.adminSubject) state.adminSubject = state.subjects[0]?.slug; try { await loadAdminQuestions(); } catch (e) { state.adminQuestions = []; toast(e.message); } } render(); }));
  $('#addSubject')?.addEventListener('click', async () => { try { await api('/api/subjects', { method: 'POST', body: JSON.stringify({ passcode: state.adminPass, name: $('#sName').value, slug: slugify($('#sName').value), icon: $('#sIcon').value || '📚', description: $('#sDesc').value || 'Practice test', durationSeconds: Number($('#sTime').value) || 30 }) }); toast('Subject added'); await loadSubjects(); render(); } catch (e) { toast(e.message); } });
  document.querySelectorAll('[data-delete-subject]').forEach(b => b.addEventListener('click', async () => { if (!confirm('Delete this subject and all its questions?')) return; try { await api('/api/subjects/' + encodeURIComponent(b.dataset.deleteSubject), { method: 'DELETE', body: JSON.stringify({ passcode: state.adminPass }) }); if (state.adminSubject === b.dataset.deleteSubject) state.adminSubject = null; await loadSubjects(); render(); } catch (e) { toast(e.message); } }));
  $('#subjectSelect')?.addEventListener('change', async e => { state.adminSubject = e.target.value; await loadAdminQuestions(); render(); });
  $('#addQuestions')?.addEventListener('click', async () => { try { const parsed = parseBulk($('#bulk').value); await api('/api/questions/' + encodeURIComponent(state.adminSubject), { method: 'POST', body: JSON.stringify({ passcode: state.adminPass, questions: parsed }) }); toast(`${parsed.length} questions uploaded`); await loadAdminQuestions(); await loadSubjects(); render(); } catch (e) { toast(e.message); } });
  $('#clearQuestions')?.addEventListener('click', async () => { if (!confirm('Clear every question in this subject?')) return; try { await api('/api/questions/' + encodeURIComponent(state.adminSubject), { method: 'DELETE', body: JSON.stringify({ passcode: state.adminPass }) }); await loadAdminQuestions(); await loadSubjects(); render(); } catch (e) { toast(e.message); } });
  document.querySelectorAll('[data-delete-q]').forEach(b => b.addEventListener('click', async () => { try { await api('/api/questions/' + encodeURIComponent(state.adminSubject) + '/' + b.dataset.deleteQ, { method: 'DELETE', body: JSON.stringify({ passcode: state.adminPass }) }); await loadAdminQuestions(); await loadSubjects(); render(); } catch (e) { toast(e.message); } }));
  $('#resultFilter')?.addEventListener('change', e => { state.resultFilter = e.target.value; render(); });
  $('#exportCsv')?.addEventListener('click', () => { const filtered = state.results.filter(r => !state.resultFilter || r.subject === state.resultFilter); if (!filtered.length) { toast('No results to export.'); return; } ExportCSV.download(filtered); });
}
(async () => { await loadSubjects(); render(); })();
