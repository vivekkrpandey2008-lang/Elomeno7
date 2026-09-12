// ---------- CSV export (admin results) ----------
// Self-contained: exposes window.ExportCSV.download(results).
(function () {
  function csvCell(v) {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function download(results) {
    if (!results.length) return;
    const header = ['Name', 'Roll', 'Subject', 'Score', 'Total', 'Percentage', 'Date'];
    const lines = [header.join(',')];
    for (const r of results) {
      const pct = Math.round((r.score / r.total) * 100);
      lines.push([
        csvCell(r.name), csvCell(r.roll), csvCell(r.subjectName || r.subject),
        r.score, r.total, pct + '%', new Date(r.timestamp).toLocaleString()
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elomeno7-results-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  window.ExportCSV = { download };
})();
