/* 经营+运气玩法验证 */
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
  await page.evaluate(() => { Game.life().age = 25; Game.life().coin = 5000; Game.refresh(); });

  // 产业经营：买奶茶店 → 升级
  await page.evaluate(() => document.getElementById('btn-map').click()); await sleep(400);
  await page.evaluate(() => [...document.querySelectorAll('[data-act]')].find(x => x.getAttribute('data-act') === 'biz').click()); await sleep(400);
  await page.screenshot({ path: SHOT('biz_panel') });
  const buyOk = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('盘下'));
    if (!b) return false; b.click(); return true;
  });
  await sleep(400);
  const ownLv = await page.evaluate(() => JSON.stringify(Game.life().biz));
  console.log('买产业:', buyOk, '持有:', ownLv);
  const upOk = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('升级'));
    if (!b) return false; b.click(); return true;
  });
  await sleep(300);
  console.log('升级:', upOk, await page.evaluate(() => JSON.stringify(Game.life().biz)));
  await page.screenshot({ path: SHOT('biz_owned') });
  // 年收益结算
  const inc = await page.evaluate(() => { const c0 = Game.life().coin; Biz.tick(Game.life()); return Game.life().coin - c0; });
  console.log('年收益入账:', inc > 0 ? inc + ' ✓' : 'FAIL ' + inc);
  // 返回 → 转盘
  await page.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.includes('返回')).click()); await sleep(300);
  await page.evaluate(() => [...document.querySelectorAll('[data-act]')].find(x => x.getAttribute('data-act') === 'luck_wheel').click()); await sleep(400);
  await page.screenshot({ path: SHOT('luck_wheel') });
  // 点击转盘开转
  await page.evaluate(() => { const c = document.getElementById('mg-canvas'); const r = c.getBoundingClientRect(); c.dispatchEvent(new MouseEvent('mousedown', { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true })); });
  await sleep(7000);
  const wheelDone = await page.evaluate(() => document.getElementById('overlay-mini').classList.contains('hidden'));
  console.log('转盘结算退出:', wheelDone ? '✓' : 'FAIL 卡住');
  // 刮刮乐
  let scratched = false;
  for (let i = 0; i < 6 && !scratched; i++) {
    const sc0 = await page.evaluate(() => Game.life().coin);
    await page.evaluate(() => [...document.querySelectorAll('[data-act]')].find(x => x.getAttribute('data-act') === 'luck_scratch').click()); await sleep(250);
    const sc1 = await page.evaluate(() => Game.life().coin);
    if (sc1 !== sc0) scratched = true;   // 回本局 net=0，多刮几次必见非零
  }
  console.log('刮刮乐结算:', scratched ? '✓' : 'FAIL');
  // 修仙世界赌石
  await page.evaluate(() => { document.getElementById('btn-map') && document.querySelector('[data-close="overlay-map"]').click(); });
  await page.evaluate(() => { Game.life().world = 'xiuxian'; Game.life().pool = 'xiuxian'; Game.life().coin = 500; Game.refresh(); });
  await page.evaluate(() => document.getElementById('btn-map').click()); await sleep(400);
  await page.evaluate(() => [...document.querySelectorAll('[data-act]')].find(x => x.getAttribute('data-act') === 'luck_stone').click()); await sleep(400);
  await page.screenshot({ path: SHOT('luck_stone') });
  await page.evaluate(() => document.querySelector('.stone-pick').click()); await sleep(2200);
  const stoneDone = await page.evaluate(() => document.getElementById('overlay-mini').classList.contains('hidden'));
  console.log('赌石结算退出:', stoneDone ? '✓' : 'FAIL 卡住');
  console.log(errors.length ? '报错:\n' + errors.join('\n') : '无报错');
  await browser.close();
})();
