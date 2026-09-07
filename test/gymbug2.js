/* 验证：音游中击中音符后游戏卡死（无法退出） */
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push('页面异常: ' + e.message));

  await page.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await page.evaluate(() => document.getElementById('btn-start').click()); await sleep(500);
  await page.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(400);
  await page.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);
  await page.evaluate(() => document.getElementById('btn-map').click()); await sleep(400);
  await page.evaluate(() => [...document.querySelectorAll('[data-act]')].find(x => x.getAttribute('data-act') === 'gym').click());
  await sleep(2500);

  // 用键盘 1/2/3 持续击打（会命中部分音符）
  for (let i = 0; i < 90; i++) {
    await page.keyboard.press(String(1 + (i % 3)));
    await sleep(350);
    const done = await page.evaluate(() => document.getElementById('overlay-mini').classList.contains('hidden'));
    if (done) { console.log('PASS: 音游在第', i, '次击打后正常退出'); break; }
    if (i === 89) console.log('FAIL: 90 次击打后音游仍未退出（卡死复现）');
  }
  console.log(errors.length ? '报错:\n' + errors.join('\n') : '无报错');
  await browser.close();
})();
