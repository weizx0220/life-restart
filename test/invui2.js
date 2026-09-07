const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1400);
  await page.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await page.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  await page.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);
  await page.evaluate(() => {
    ['it_sword','it_robe','it_crown','it_ring','it_bell','it_apple','it_milktea'].forEach(id => Game.gainItem(id));
    Game.life().coin = 888; Game.refresh();
  });
  await page.evaluate(() => document.getElementById('btn-inv').click()); await sleep(500);
  await page.evaluate(() => document.querySelector('[data-itab="bag"]').click()); await sleep(400);
  await page.screenshot({ path: 'test/shots/inv_mobile2.png' });
  await page.setViewport({ width: 1440, height: 900 }); await sleep(300);
  await page.evaluate(() => document.querySelector('[data-close="overlay-inv"]').click()); await sleep(300);
  await page.mouse.move(720, 500); await page.mouse.down();
  await sleep(150);
  const has = await page.evaluate(() => !!document.querySelector('.tap-ripple'));
  await page.screenshot({ path: 'test/shots/tap_ripple2.png' });
  await page.mouse.up();
  console.log('波纹元素存在:', has);
  await browser.close();
})();
