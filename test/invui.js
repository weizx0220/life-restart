/* 行囊全屏界面 + 装备图标 + 波纹/挤压特效 截图验证 */
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
  await sleep(1500);
  await page.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await page.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  await page.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);
  // 塞装备和物品
  await page.evaluate(() => {
    ['it_sword', 'it_robe', 'it_crown', 'it_ring', 'it_bell', 'it_apple', 'it_milktea', 'it_zhuxian', 'it_vest', 'it_gourd'].forEach(id => Game.gainItem(id));
    Game.life().coin = 888;
    Game.refresh();
  });
  await page.evaluate(() => document.getElementById('btn-inv').click()); await sleep(600);
  await page.screenshot({ path: SHOT('inv_full_equip') });
  // 切行囊页
  await page.evaluate(() => document.querySelector('[data-itab="bag"]').click()); await sleep(400);
  await page.screenshot({ path: SHOT('inv_full_bag') });
  await page.evaluate(() => document.querySelector('[data-close="overlay-inv"]').click()); await sleep(300);
  // 波纹特效截图（按下瞬间）
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await sleep(180);
  await page.screenshot({ path: SHOT('tap_ripple') });
  await page.mouse.up();
  // 手机视口行囊
  await page.setViewport({ width: 390, height: 844 });
  await sleep(400);
  await page.evaluate(() => document.getElementById('btn-inv').click()); await sleep(500);
  await page.screenshot({ path: SHOT('inv_mobile') });
  console.log(errors.length ? '报错:\n' + errors.join('\n') : '无报错');
  await browser.close();
})();
