const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent(`<button id=o>open</button><dialog id=d><button id=i>in</button></dialog>
  <div><button id=t aria-describedby=s>Save</button><span id=s slot=description role=tooltip hidden>Saves the draft</span></div>`);
  await p.evaluate(() => { const d = document.getElementById('d'); window.log=[]; d.addEventListener('cancel', e => { log.push('cancel:'+e.cancelable); e.preventDefault(); }); d.addEventListener('close', () => log.push('close')); });
  await p.click('#o'); await p.evaluate(() => document.getElementById('d').showModal());
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  console.log('cancel-only', await p.evaluate(() => [log, document.getElementById('d').open]));
  // variant: keydown handler preventDefault on Escape
  await p.evaluate(() => { const d = document.getElementById('d'); if(!d.open) d.showModal(); log=[]; d.addEventListener('keydown', e => { if (e.key==='Escape') { e.preventDefault(); log.push('kd'); } }); });
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  console.log('keydown-prevent', await p.evaluate(() => [log, document.getElementById('d').open]));
  await p.evaluate(() => document.getElementById('d').close());
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Accessibility.enable');
  const {nodes} = await cdp.send('Accessibility.getFullAXTree');
  const n = nodes.find(n => n.name && n.name.value === 'Save');
  console.log('desc', n && n.description, n && n.role);
  await b.close();
})();
