const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const AXE = fs.readFileSync(path.join(__dirname, 'pkg/package/axe.min.js'), 'utf8');

async function withBrowser(fn) {
  const browser = await chromium.launch();
  try { return await fn(browser); } finally { await browser.close(); }
}

// returns indented text of AX tree (descendants of body), marking ignored nodes
async function axTree(page, { showIgnored = true } = {}) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const byId = new Map(nodes.map(n => [n.nodeId, n]));
  const root = nodes.find(n => !n.parentId);
  const out = [];
  const prop = (n, k) => (n.properties || []).find(p => p.name === k)?.value?.value;
  function walk(n, d) {
    const role = n.role?.value;
    const name = n.name?.value;
    const val = n.value?.value;
    let s = `${'  '.repeat(d)}${n.ignored ? '[ignored] ' : ''}${role}`;
    if (name) s += ` "${name}"`;
    if (val !== undefined && val !== '') s += ` value=${JSON.stringify(val)}`;
    for (const k of ['valuemin', 'valuemax', 'valuetext', 'busy']) { const v = prop(n, k); if (v !== undefined) s += ` ${k}=${JSON.stringify(v)}`; }
    if (n.ignored) { const r = (n.ignoredReasons||[]).filter(r=>r.value?.value===true||r.value?.type==='idref').map(r=>r.name); if (r.length) s += ` (${r.join(',')})`; }
    if (!(n.ignored && !showIgnored) && role !== 'InlineTextBox') out.push(s);
    for (const c of n.childIds || []) { const ch = byId.get(c); if (ch) walk(ch, n.ignored && !showIgnored ? d : d + 1); }
  }
  walk(root, 0);
  return out.join('\n');
}

async function axe(page, rules) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async (rules) => {
    const pick = r => r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, targets: v.nodes.map(x => JSON.stringify(x.target)).slice(0,3) }));
    const focused = await axe.run(document, { runOnly: { type: 'rule', values: rules } });
    const full = await axe.run(document);
    return {
      focused: pick(focused),
      focusedPasses: focused.passes.map(p => p.id),
      focusedInapplicable: focused.inapplicable.map(p => p.id),
      fullSeriousCritical: pick(full).filter(v => v.impact === 'serious' || v.impact === 'critical'),
      fullOther: pick(full).filter(v => !(v.impact === 'serious' || v.impact === 'critical')),
    };
  }, rules);
}
module.exports = { withBrowser, axTree, axe, AXE_VERSION: '4.10.2' };
module.exports.fmtAxe = (r) => [
  'axe focused violations: ' + (r.focused.map(v => `${v.id}(${v.impact},${v.n}) ${v.targets.join(' ')}`).join('; ') || 'none'),
  'axe focused passes: ' + r.focusedPasses.join(','),
  'axe full serious/critical: ' + (r.fullSeriousCritical.map(v => `${v.id}(${v.impact},${v.n})`).join('; ') || 'none'),
  'axe full minor/moderate: ' + (r.fullOther.map(v => `${v.id}(${v.impact},${v.n})`).join('; ') || 'none'),
].join('\n');
