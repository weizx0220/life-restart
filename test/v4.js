/* v3b 专项：天赋锁定 / 死亡复活拼图 / 道具使用效果弹窗 */
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const SHOT = (n) => 'C:/Users/魏/life-restart/test/shots/' + n + '.png';

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

  // ===== 1. 天赋锁定 =====
  await page.evaluate(() => document.getElementById('btn-start').click()); await sleep(500);
  await page.evaluate(() => document.querySelectorAll('.hero-card')[0].click()); await sleep(400);
  await page.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(1600);
  // 锁前两张
  await page.evaluate(() => document.querySelectorAll('.tlock')[0].click()); await sleep(150);
  await page.evaluate(() => document.querySelectorAll('.tlock')[1].click()); await sleep(150);
  // 锁第三张应被拒绝
  await page.evaluate(() => document.querySelectorAll('.tlock')[2].click()); await sleep(150);
  let lockCount = await page.evaluate(() => document.querySelectorAll('.tlock.on').length);
  if (lockCount !== 2) errors.push('锁定数量应为2，实际 ' + lockCount);
  const lockedNames = await page.evaluate(() =>
    [...document.querySelectorAll('.tcard')].slice(0, 2).map(c => c.querySelector('.tname').textContent));
  await page.screenshot({ path: SHOT('v4-lock') });
  // 换一批
  await page.evaluate(() => document.getElementById('btn-redraw').click()); await sleep(1600);
  const newFirst2 = await page.evaluate(() =>
    [...document.querySelectorAll('.tcard')].filter(c => c.querySelector('.tlock.on')).map(c => c.querySelector('.tname').textContent));
  const kept = lockedNames.filter(n => newFirst2.includes(n));
  if (kept.length !== 2) errors.push('换一批后锁定天赋未保留: ' + JSON.stringify({ lockedNames, newFirst2 }));
  console.log('锁定保留:', JSON.stringify(newFirst2));

  // 继续走完开局
  const cards = await page.$$('.tcard');
  await cards[0].click(); await cards[1].click(); await cards[2].click(); await sleep(300);
  await page.evaluate(() => document.getElementById('btn-draw-ok').click()); await sleep(400);
  await page.evaluate(() => document.getElementById('btn-random-alloc').click()); await sleep(300);
  await page.evaluate(() => document.getElementById('btn-alloc-ok').click()); await sleep(600);

  // ===== 2. 道具使用效果弹窗 =====
  await page.evaluate(() => { Game.gainItem('it_apple'); Game.gainItem('it_ginseng'); });
  await page.evaluate(() => document.getElementById('btn-inv').click()); await sleep(500);
  // 切到行囊页签
  await page.evaluate(() => document.querySelector('[data-itab="bag"]').click()); await sleep(400);
  const before = await page.evaluate(() => Game.life().attr.str);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('#inv-list .ink-btn')].filter(b => b.textContent === '使用');
    if (btns.length) btns[0].click();
  });
  await sleep(500);
  const helpOn = await page.evaluate(() => document.getElementById('help-panel').classList.contains('on'));
  const helpTxt = await page.evaluate(() => document.getElementById('help-text').textContent);
  const after = await page.evaluate(() => Game.life().attr.str);
  if (!helpOn) errors.push('使用道具后无效果弹窗');
  if (helpTxt.indexOf('体质') < 0 && helpTxt.indexOf('效果') < 0) errors.push('弹窗缺效果描述: ' + helpTxt);
  console.log('道具弹窗:', helpTxt.replace(/\s+/g, ' ').slice(0, 60), '| 体质', before, '→', after);
  await page.screenshot({ path: SHOT('v4-item-effect') });
  await page.evaluate(() => document.getElementById('help-panel').click()); await sleep(300);
  await page.evaluate(() => document.querySelector('#overlay-inv .overlay-close').click()); await sleep(300);

  // ===== 3. 死亡复活拼图 =====
  await page.evaluate(() => { Game.life().attr.str = -5; });   // 触发病逝
  await page.evaluate(() => document.getElementById('btn-next').click()); await sleep(800);
  // 可能有涅槃符判断在前（无增益则直接病死→复活弹层）
  let reviveShown = await page.evaluate(() => !document.getElementById('overlay-revive').classList.contains('hidden'));
  if (!reviveShown) errors.push('死亡后未出现复活抉择');
  await page.screenshot({ path: SHOT('v4-revive-offer') });
  await page.evaluate(() => document.getElementById('btn-ad-revive').click()); await sleep(800);
  const pzShown = await page.evaluate(() => !document.getElementById('overlay-puzzle').classList.contains('hidden'));
  if (!pzShown) errors.push('拼图未打开');
  await sleep(600);
  const tileCount = await page.evaluate(() => document.querySelectorAll('.pz-tile').length);
  if (tileCount !== 9) errors.push('拼图格数异常: ' + tileCount);
  await page.screenshot({ path: SHOT('v4-puzzle') });
  // 自动解拼图：读每格 backgroundPosition 推出正确位置，逐步交换
  for (let step = 0; step < 30; step++) {
    const done = await page.evaluate(() => {
      const tiles = [...document.querySelectorAll('.pz-tile')];
      const cur = tiles.map(t => {
        const bp = t.style.backgroundPosition.split(' ');
        const cx = -parseFloat(bp[0]) / 100, cy = -parseFloat(bp[1]) / 100;
        return cy * 3 + cx;   // 该格当前显示的图块编号
      });
      for (let i = 0; i < 9; i++) {
        if (cur[i] !== i) {
          const j = cur.indexOf(i);
          tiles[i].click();
          return new Promise(r => setTimeout(() => { tiles[j] ? document.querySelectorAll('.pz-tile')[j].click() : null; r(false); }, 120));
        }
      }
      return true;
    });
    if (done) break;
    await sleep(250);
  }
  await sleep(1500);
  const backAlive = await page.evaluate(() =>
    document.getElementById('overlay-puzzle').classList.contains('hidden') &&
    document.getElementById('screen-life').classList.contains('active') &&
    !Game.life().dead);
  if (!backAlive) errors.push('拼图完成后未复活');
  console.log('复活状态: dead=', await page.evaluate(() => Game.life().dead));
  await page.screenshot({ path: SHOT('v4-revived') });

  await browser.close();
  if (errors.length) { console.log('问题:'); errors.forEach(e => console.log(' ✗', e)); process.exit(1); }
  console.log('\n==== v4 专项测试全部通过 ====');
})().catch(e => { console.error('失败:', e.stack); process.exit(1); });
