const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1300);
  await p.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await p.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  await p.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);
  await p.evaluate(() => { const L = Game.life(); L.attr.str = 3; L.age = 96; });
  for (let i = 0; i < 15; i++) {
    const st = await p.evaluate(() => {
      const b = document.getElementById('btn-next');
      b.click();
      return {
        age: Game.life() && Game.life().age, dead: Game.life() && Game.life().dead,
        waiting: !!document.querySelector('#choice-box:not(.hidden)'),
        battle: !document.getElementById('overlay-battle').classList.contains('hidden'),
        revive: !document.getElementById('overlay-revive').classList.contains('hidden'),
        summary: !!document.querySelector('#screen-summary.active')
      };
    });
    console.log(i, JSON.stringify(st));
    if (st.summary || st.revive) break;
    await p.evaluate(() => { const c = document.querySelector('#choice-options button'); if (c) c.click(); });
    await sleep(200);
  }
  console.log(errs.length ? 'ERR: ' + errs.join(';') : 'no err');
  await b.close();
})();
