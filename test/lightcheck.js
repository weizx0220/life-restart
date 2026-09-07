const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1300);
  await p.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await p.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  await p.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);
  const dark = await p.evaluate(() => !!document.body.dataset.world);
  console.log('都市世界深色标记:', dark, '（应为 false）');
  await p.screenshot({ path: 'test/shots/life_light.png' });
  await p.evaluate(() => document.getElementById('btn-map').click()); await sleep(500);
  await p.screenshot({ path: 'test/shots/life_map_light.png' });
  await b.close();
})();
