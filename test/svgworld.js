const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1200);
  await p.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await p.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  // 选修仙界（最后一个世界卡）
  await p.evaluate(() => { const cs = document.querySelectorAll('.world-card'); cs[cs.length - 1].click(); }); await sleep(900);
  await p.evaluate(() => document.getElementById('btn-map').click()); await sleep(600);
  await p.screenshot({ path: 'test/shots/svg_world_xx.png' });
  await b.close();
})();
