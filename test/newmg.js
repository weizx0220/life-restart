/* 新小游戏验证：打靶/垂钓/除草 能开能玩能退出 */
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1300);
  await p.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await p.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  await p.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);
  await p.evaluate(() => { Game.life().age = 25; Game.life().coin = 500; Game.refresh(); });

  for (const [id, wait] of [['shoot', 2000], ['fish', 3000], ['mow', 2000]]) {
    await p.evaluate(() => document.getElementById('btn-map').click()); await sleep(300);
    const found = await p.evaluate((aid) => {
      const btn = [...document.querySelectorAll('[data-act]')].find(x => x.getAttribute('data-act') === aid);
      if (btn) btn.click();
      return !!btn;
    }, id);
    await sleep(600);
    const open = await p.evaluate(() => !document.getElementById('overlay-mini').classList.contains('hidden'));
    console.log(id, '行动存在:', found, '| 游戏打开:', open);
    if (open) {
      await p.screenshot({ path: 'test/shots/mg_' + id + '.png' });
      // 玩一会儿再跳过
      await p.evaluate(() => { const c = document.getElementById('mg-canvas'); if (c) { const r = c.getBoundingClientRect(); c.dispatchEvent(new MouseEvent('mousedown', { clientX: r.left + 200, clientY: r.top + 150, bubbles: true })); } });
      await sleep(wait);
      await p.evaluate(() => document.getElementById('mini-skip').click()); await sleep(500);
      const closed = await p.evaluate(() => document.getElementById('overlay-mini').classList.contains('hidden'));
      console.log(id, '跳过退出:', closed);
    }
  }
  console.log(errs.length ? '报错:\n' + errs.join('\n') : '无报错');
  await b.close();
})();
