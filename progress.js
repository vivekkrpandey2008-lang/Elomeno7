// ---------- My Progress (student-facing) ----------
// Self-contained: exposes window.Progress with load() and render().
// Uses GET /api/results/:roll (added in server.js) which returns only
// that student's own attempts — no admin passcode needed.
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

  async function load(roll) {
    const r = await fetch('/api/results/' + encodeURIComponent(roll));
    if (!r.ok) return [];
    return r.json().catch(() => []);
  }

  function band(pct) {
    if (pct >= 75) return '';       // teal (default)
    if (pct >= 45) return 'mid';    // amber
    return 'low';                   // red
  }

  function render(results) {
    if (!results.length) {
      return `<div class="empty">No attempts yet. Take a test and your progress will show up here.</div>`;
    }
    const total = results.length;
    const avg = Math.round(results.reduce((n, r) => n + (r.score / r.total) * 100, 0) / total);
    const best = Math.max(...results.map(r => Math.round((r.score / r.total) * 100)));
    const subjectsCount = new Set(results.map(r => r.subject)).size;

    const rows = results.slice(0, 25).map(r => {
      const pct = Math.round((r.score / r.total) * 100);
      const date = new Date(r.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      return `<div class="history-row">
        <div class="history-meta"><b>${esc(r.subjectName || r.subject)}</b><br>${date}</div>
        <div class="history-bar-track"><div class="history-bar-fill ${band(pct)}" style="width:${pct}%"></div></div>
        <div class="history-pct">${pct}%</div>
      </div>`;
    }).join('');

    return `
      <div class="stat-row">
        <div class="stat-box"><b>${total}</b><span>Tests taken</span></div>
        <div class="stat-box"><b>${avg}%</b><span>Average score</span></div>
        <div class="stat-box"><b>${best}%</b><span>Best score</span></div>
        <div class="stat-box"><b>${subjectsCount}</b><span>Subjects tried</span></div>
      </div>
      <div class="history-list">${rows}</div>
    `;
  }

  window.Progress = { load, render };
})();
