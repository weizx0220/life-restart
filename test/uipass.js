/* 四界面美化验证截图 */
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const SHOT = (n) => 'C:/Users/魏/life-restart/test/shots/' + n + '.png';
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push('页面异常: ' + e.message));
  await page.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1600);
  await page.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await page.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  await page.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);
  // 行动界面
  await page.evaluate(() => document.getElementById('btn-map').click()); await sleep(700);
  await page.screenshot({ path: SHOT('ui_map') });
  // 商店
  await page.evaluate(() => [...document.querySelectorAll('[data-act]')].find(x => x.getAttribute('data-act') === 'shop').click()); await sleep(500);
  await page.screenshot({ path: SHOT('ui_shop') });
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('返回')) ? [...document.querySelectorAll('button')].find(b => b.textContent.includes('返回')).click() : 0); await sleep(400);
  // 战斗界面
  await page.evaluate(() => {
    Combat.start({ title: '遭遇战', life: Game.life(), enemies: [{ name: '巨狼妖兽', intro: '獠牙滴着黏液。', hp: 80, atk: 10, def: 2 }], onEnd: function () {} });
  });
  await sleep(700);
  await page.screenshot({ path: SHOT('ui_battle') });
  await page.evaluate(() => Combat.concede()); await sleep(400);
  // 手机端行动界面
  await page.setViewport({ width: 390, height: 844 }); await sleep(400);
  await page.evaluate(() => document.getElementById('btn-map').click()); await sleep(600);
  await page.screenshot({ path: SHOT('ui_map_mobile') });
  console.log(errors.length ? '报错:\n' + errors.join('\n') : '无报错');
  await browser.close();
})();
