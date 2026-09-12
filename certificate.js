// ---------- Completion certificate ----------
// Self-contained: exposes window.Certificate.open({name, roll, subject, score, total}).
// Opens a new tab with a printable certificate and triggers the print dialog.
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

  function open({ name, roll, subject, score, total }) {
    const pct = Math.round((score / total) * 100);
    const date = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Certificate — ${esc(name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#EFE9D8;font-family:Inter,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px}
  .cert{width:min(760px,100%);background:#FAF6EE;border:10px solid #14181f;padding:56px 48px;text-align:center;position:relative}
  .cert:before{content:"";position:absolute;inset:14px;border:1px solid #C1791E}
  .mark{font-family:Fraunces,serif;font-weight:700;font-size:15px;letter-spacing:2px;color:#9C5F17}
  h1{font-family:Fraunces,serif;font-size:34px;margin:14px 0 6px;color:#231F18;font-weight:600}
  .sub{color:#736B5C;font-size:14px;margin-bottom:28px}
  .name{font-family:Fraunces,serif;font-size:30px;font-style:italic;color:#231F18;margin:18px 0;border-bottom:1px solid #C1791E;display:inline-block;padding-bottom:6px}
  .detail{color:#231F18;font-size:15px;line-height:1.8;margin-top:10px}
  .score{font-family:Fraunces,serif;font-size:22px;color:#9C5F17;margin-top:6px}
  .foot{margin-top:40px;display:flex;justify-content:space-between;font-size:12px;color:#736B5C}
  @media print{ body{background:#fff;padding:0} .cert{border-width:8px} }
</style></head>
<body>
  <div class="cert">
    <div class="mark">ELOMENO7 STUDY</div>
    <h1>Certificate of Completion</h1>
    <div class="sub">This is to certify that</div>
    <div class="name">${esc(name)}</div>
    <div class="detail">Roll number ${esc(roll)} has successfully completed the<br><b>${esc(subject)}</b> practice test</div>
    <div class="score">${score} / ${total} correct · ${pct}%</div>
    <div class="foot"><span>Elomeno7 Study Portal</span><span>${date}</span></div>
  </div>
  <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body></html>`);
    win.document.close();
  }

  window.Certificate = { open };
})();
