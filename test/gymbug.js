/* 复现：健身行动（音游）无反应 + 音游结束后无法退出 */
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
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await page.evaluate(() => document.getElementById('btn-start').click()); await sleep(500);
  await page.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(400);
  await page.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);

  // 打开地图，点健身
  await page.evaluate(() => document.getElementById('btn-map').click()); await sleep(400);
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('[data-act]')].find(x => x.getAttribute('data-act') === 'gym');
    if (!b) return 'no-gym-btn';
    if (b.disabled) return 'disabled:' + b.textContent;
    b.click(); return 'clicked';
  });
  console.log('点击健身:', clicked);
  await sleep(2500);
  const st1 = await page.evaluate(() => ({
    miniOpen: !document.getElementById('overlay-mini').classList.contains('hidden'),
    mapOpen: !document.getElementById('overlay-map').classList.contains('hidden'),
    phaser: typeof Phaser !== 'undefined',
    canvas: !!document.querySelector('#phaser-host canvas')
  }));
  console.log('音游状态:', JSON.stringify(st1));

  if (st1.miniOpen) {
    // 模拟全部击中：直接在页面里疯狂点三条轨道中间
    console.log('等待音符下落并全部点击……');
    for (let i = 0; i < 70; i++) {
      await page.evaluate(() => {
        const c = document.querySelector('#phaser-host canvas');
        if (!c) return;
        const r = c.getBoundingClientRect();
        [95, 235, 375].forEach(x => {
          c.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + x * r.width / 420, clientY: r.top + 270 * r.height / 320, bubbles: true }));
        });
      });
      await sleep(600);
      const done = await page.evaluate(() => document.getElementById('overlay-mini').classList.contains('hidden'));
      if (done) { console.log('音游已正常退出, 循环', i, '次'); break; }
      if (i === 69) console.log('!! 70 次循环后音游仍未退出');
    }
    const st2 = await page.evaluate(() => ({
      miniOpen: !document.getElementById('overlay-mini').classList.contains('hidden'),
      mapOpen: !document.getElementById('overlay-map').classList.contains('hidden')
    }));
    console.log('结束后状态:', JSON.stringify(st2));
  }
  console.log(errors.length ? '报错:\n' + errors.join('\n') : '无报错');
  await browser.close();
})();
