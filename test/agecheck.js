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
  await p.evaluate(() => document.querySelectorAll('.hero-card')[0].click()); await sleep(400);
  await p.screenshot({ path: 'test/shots/age_worlds.png' });
  await p.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(700);
  // 抽卡+分配进人生
  await p.evaluate(() => { document.querySelectorAll('.tcard').forEach((c, i) => { if (i < 3) c.click(); }); }); await sleep(300);
  await p.evaluate(() => document.getElementById('btn-draw-ok').click()); await sleep(400);
  await p.evaluate(() => { const b2 = document.getElementById('btn-alloc-ok') || document.getElementById('btn-random-alloc'); if (b2) b2.click(); }); await sleep(800);
  // 5 岁（童年）行动
  await p.evaluate(() => { Game.life().age = 5; Game.refresh(); });
  await p.evaluate(() => document.getElementById('btn-map').click()); await sleep(400);
  await p.screenshot({ path: 'test/shots/age_child.png' });
  // 28 岁（成年）行动
  await p.evaluate(() => { Game.life().age = 28; Game.refresh(); });
  await p.evaluate(() => document.getElementById('btn-map').click()); await sleep(100);
  await p.evaluate(() => document.getElementById('btn-map').click()); await sleep(400);
  await p.screenshot({ path: 'test/shots/age_adult.png' });
  console.log(errs.length ? '报错:' + errs.join(';') : '无报错');
  await b.close();
})();
