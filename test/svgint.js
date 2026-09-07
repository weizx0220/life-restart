const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1200);
  await p.screenshot({ path: 'test/shots/svg_title.png' });
  await p.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await p.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  await p.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);
  await p.evaluate(() => document.getElementById('btn-map').click()); await sleep(600);
  await p.screenshot({ path: 'test/shots/svg_corners.png' });
  console.log(errs.length ? '报错:' + errs.join(';') : '无报错');
  await b.close();
})();
