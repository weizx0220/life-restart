/* 跳过按钮测试：音游 / 速算 跳过按 1 倍结算退出 */
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await page.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await page.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  await page.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(800);
  await page.evaluate(() => document.getElementById('btn-map').click()); await sleep(400);
  await page.evaluate(() => [...document.querySelectorAll('[data-act]')].find(x => x.getAttribute('data-act') === 'gym').click());
  await sleep(2000);
  await page.evaluate(() => document.getElementById('mini-skip').click()); await sleep(600);
  const st1 = await page.evaluate(() => ({ mini: !document.getElementById('overlay-mini').classList.contains('hidden'), map: !document.getElementById('overlay-map').classList.contains('hidden') }));
  console.log('音游跳过后:', JSON.stringify(st1));
  await page.evaluate(() => [...document.querySelectorAll('[data-act]')].find(x => x.getAttribute('data-act') === 'study').click());
  await sleep(600);
  await page.evaluate(() => document.getElementById('mini-skip').click()); await sleep(600);
  const st2 = await page.evaluate(() => ({ mini: !document.getElementById('overlay-mini').classList.contains('hidden'), map: !document.getElementById('overlay-map').classList.contains('hidden') }));
  console.log('速算跳过后:', JSON.stringify(st2));
  console.log(errors.length ? '报错:\n' + errors.join('\n') : '无报错');
  await browser.close();
})();
