// ---------- Admin Analytics ----------
// Self-contained: exposes window.Analytics.render(subjects, results).
// Pure computation over data the admin panel already loads — no new
// network calls needed.
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

  function render(subjects, results) {
    if (!results.length) {
      return `<div class="empty">No test attempts recorded yet. Analytics will appear once students start taking tests.</div>`;
    }

    const totalAttempts = results.length;
    const uniqueStudents = new Set(results.map(r => r.roll)).size;
    const overallAvg = Math.round(results.reduce((n, r) => n + (r.score / r.total) * 100, 0) / totalAttempts);

    const bySubject = {};
    for (const r of results) {
      const key = r.subject;
      if (!bySubject[key]) bySubject[key] = { name: r.subjectName || key, total: 0, count: 0 };
      bySubject[key].total += (r.score / r.total) * 100;
      bySubject[key].count += 1;
    }
    const subjectRows = Object.values(bySubject)
      .map(s => ({ name: s.name, avg: Math.round(s.total / s.count), attempts: s.count }))
      .sort((a, b) => b.attempts - a.attempts)
      .map(s => `<div class="bar-row">
        <div class="bar-row-label">${esc(s.name)}</div>
        <div class="bar-row-track"><div class="bar-row-fill" style="width:${s.avg}%"></div></div>
        <div class="bar-row-value">${s.avg}% avg</div>
      </div>`).join('');

    const byStudent = {};
    for (const r of results) {
      const pct = Math.round((r.score / r.total) * 100);
      if (!byStudent[r.roll] || byStudent[r.roll].pct < pct) {
        byStudent[r.roll] = { name: r.name, roll: r.roll, pct, subject: r.subjectName || r.subject };
      }
    }
    const leaders = Object.values(byStudent).sort((a, b) => b.pct - a.pct).slice(0, 5)
      .map((s, i) => `<div class="leader-row">
        <div class="leader-rank">${i + 1}</div>
        <div style="flex:1"><b>${esc(s.name)}</b><div class="small">Roll ${esc(s.roll)} · ${esc(s.subject)}</div></div>
        <div style="font-weight:700">${s.pct}%</div>
      </div>`).join('');

    return `
      <div class="metric-grid">
        <div class="metric-card"><b>${totalAttempts}</b><span>Total attempts</span></div>
        <div class="metric-card"><b>${uniqueStudents}</b><span>Students active</span></div>
        <div class="metric-card"><b>${overallAvg}%</b><span>Overall average score</span></div>
      </div>
      <div class="admin-grid">
        <section class="panel"><h2>Subject-wise average</h2>${subjectRows}</section>
        <section class="panel"><h2>Top scorers</h2>${leaders || '<div class="empty">No results yet.</div>'}</section>
      </div>
    `;
  }

  window.Analytics = { render };
})();
