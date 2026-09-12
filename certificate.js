// ---------- Completion certificate ----------
// Self-contained: exposes window.Certificate.open({name, roll, subject, score, total}).
// Classic ornate certificate layout (silver guilloché border, blackletter
// title, script name) opened in a new tab with the print dialog ready.
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

  const SIGNER_NAME = 'Anish Ranjan';
  const SIGNER_TITLE = 'Elomeno7';
  const GIVEN_BY = 'Anish Ranjan';

  function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function open({ name, roll, subject, score, total }) {
    const pct = Math.round((score / total) * 100);
    const now = new Date();
    const day = ordinal(now.getDate());
    const month = now.toLocaleDateString(undefined, { month: 'long' });
    const year = now.getFullYear();

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Certificate — ${esc(name)}</title>
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Tangerine:wght@700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#dcdcdc;font-family:'EB Garamond',Georgia,serif;display:grid;place-items:center;min-height:100vh;padding:26px}

  .frame{
    width:min(920px,100%);aspect-ratio:4/3;position:relative;padding:32px;
    background: repeating-linear-gradient(45deg,#8f8f8f 0px,#8f8f8f 6px,#e9e9e9 6px,#e9e9e9 12px,#bcbcbc 12px,#bcbcbc 18px,#f4f4f4 18px,#f4f4f4 24px);
    box-shadow:0 10px 40px rgba(0,0,0,.25);
  }
  .inner{
    position:relative;height:100%;border:2px solid #1a1a1a;padding:26px 40px;
    display:flex;flex-direction:column;align-items:center;text-align:center;
    background:
      repeating-linear-gradient(45deg,rgba(0,0,0,.05) 0px,rgba(0,0,0,.05) 1px,transparent 1px,transparent 5px),
      repeating-linear-gradient(-45deg,rgba(0,0,0,.05) 0px,rgba(0,0,0,.05) 1px,transparent 1px,transparent 5px),
      #f4f4f2;
  }
  .inner:before{content:"";position:absolute;inset:6px;border:1px solid #1a1a1a;pointer-events:none}

  .title{font-family:'UnifrakturMaguntia',cursive;font-size:52px;color:#111;line-height:1;margin:22px 0 6px;letter-spacing:1px}
  .certifies{font-family:'Tangerine',cursive;font-weight:700;font-size:34px;color:#222;margin:2px 0 18px}

  .line{border-bottom:1px solid #111;min-width:520px;max-width:80%;margin:14px auto 4px;padding-bottom:4px}
  .name{font-family:'Tangerine',cursive;font-weight:700;font-size:46px;color:#111}
  .caption{font-size:16px;color:#222;margin:8px 0}
  .subject-line{font-family:'EB Garamond',serif;font-weight:600;font-size:20px;color:#111}

  .spacer{flex:1}

  .footer-row{display:flex;justify-content:space-between;width:100%;margin-top:8px;font-size:15px;color:#111;gap:20px}
  .given{border-bottom:1px solid #111;padding:0 6px 3px;min-width:230px;font-weight:600}
  .datebit{border-bottom:1px solid #111;padding:0 8px 2px;font-weight:600}

  .sig-row{display:flex;justify-content:flex-end;width:100%;margin-top:30px}
  .sig-block{text-align:center}
  .sig-name{font-family:'Tangerine',cursive;font-weight:700;font-size:32px;color:#111;border-bottom:1px solid #111;padding:0 30px 2px}
  .sig-title{font-size:13px;letter-spacing:1px;color:#333;margin-top:5px;text-transform:uppercase}

  .watermark{position:absolute;bottom:14px;left:0;right:0;text-align:center;font-size:10.5px;letter-spacing:2px;color:#999;text-transform:uppercase}

  @media print{ body{background:#fff;padding:0} .frame{width:100%;aspect-ratio:auto;min-height:100vh} }
</style></head>
<body>
  <div class="frame">
    <div class="inner">
      <div class="title">Certificate of Completion</div>
      <div class="certifies">This Certifies That</div>

      <div class="line"><div class="name">${esc(name)}</div></div>
      <div class="caption">Roll number ${esc(roll)} has completed the requirements of</div>

      <div class="line"><div class="subject-line">${esc(subject)} Practice Test — scored ${score}/${total} (${pct}%)</div></div>
      <div class="caption">and is awarded this certificate.</div>

      <div class="spacer"></div>

      <div class="footer-row">
        <div>Given by:&nbsp;<span class="given">${esc(GIVEN_BY)}</span></div>
        <div>This <span class="datebit">${day}</span> Day of <span class="datebit">${esc(month)}</span> Year of <span class="datebit">${year}</span></div>
      </div>

      <div class="sig-row">
        <div class="sig-block">
          <div class="sig-name">${esc(SIGNER_NAME)}</div>
          <div class="sig-title">${esc(SIGNER_TITLE)}</div>
        </div>
      </div>

      <div class="watermark">Elomeno7 Study Portal</div>
    </div>
  </div>
  <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body></html>`);
    win.document.close();
  }

  window.Certificate = { open };
})();
