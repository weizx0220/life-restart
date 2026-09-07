const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const p = await b.newPage();
  await p.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1200);
  await p.evaluate(() => document.getElementById('btn-start').click()); await sleep(300);
  await p.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  await p.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(800);
  const res = await p.evaluate(() => {
    Game.life().coin = 1000;
    const deltas = [];
    for (let i = 0; i < 40; i++) {
      const c0 = Game.life().coin;
      Luck.scratch(5);
      deltas.push(Game.life().coin - c0);
    }
    return deltas;
  });
  const counts = {};
  res.forEach(d => counts[d] = (counts[d] || 0) + 1);
  console.log('40 次刮刮乐收益分布:', JSON.stringify(counts));
  await b.close();
})();
