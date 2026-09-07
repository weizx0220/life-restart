/* 卡牌战斗实测：进幽冥幻境 → 选战斗节点 → 打完整场卡牌战斗 */
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
  // 模板开局（属性固定，省抽卡）
  await page.evaluate(() => document.getElementById('btn-start').click()); await sleep(500);
  await page.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(400); // 孙笑川
  await page.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);

  await page.evaluate(() => { Game.life().age = 20; Game.refresh(); });
  // 打开地图 → 幽冥幻境
  await page.evaluate(() => document.getElementById('btn-map').click()); await sleep(400);
  await page.evaluate(() => {
    const r = [...document.querySelectorAll('[data-act]')].find(b => b.getAttribute('data-act') === 'rogue');
    if (r) r.click();
  });
  await sleep(600);
  const rogueOpen = await page.evaluate(() => !document.getElementById('overlay-rogue').classList.contains('hidden'));
  if (!rogueOpen) errors.push('幻境未打开');

  // 爬塔主循环：选节点/打牌/领奖
  let battleShot = false, floors = 0;
  for (let step = 0; step < 120; step++) {
    const st = await page.evaluate(() => {
      const rogue = !document.getElementById('overlay-rogue').classList.contains('hidden');
      const battle = !document.getElementById('overlay-cbattle').classList.contains('hidden');
      return { rogue, battle };
    });
    if (!st.rogue && !st.battle) break;   // 幻境已结束
    if (st.battle) {
      if (!battleShot) { await sleep(700); await page.screenshot({ path: SHOT('c1-cardbattle') }); battleShot = true; }
      // 打第一张可用牌，没牌可打就结束回合
      const acted = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.cb-card:not(.disabled)')];
        if (cards.length) { cards[0].click(); return 'play'; }
        const end = document.querySelectorAll('.cb-card').length;  // 结束按钮不在hand里时
        const btn = [...document.querySelectorAll('#overlay-cbattle .ink-btn')].find(x => x.textContent === '凯旋' || x.textContent === '撤退');
        if (btn) { btn.click(); return 'end'; }
        const eb = document.getElementById('cb-endturn');
        if (eb) { eb.click(); return 'endturn'; }
        return 'wait';
      });
      if (acted === 'end') { await sleep(500); continue; }
      await sleep(450);
      continue;
    }
    // 幻境内：优先战斗/精英节点，否则第一个
    const clicked = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('.rg-node')];
      if (!nodes.length) return false;
      const fight = nodes.find(n => n.className.indexOf('rg-fight') >= 0) ||
                    nodes.find(n => n.className.indexOf('rg-elite') >= 0) ||
                    nodes.find(n => n.className.indexOf('rg-boss') >= 0);
      (fight || nodes[0]).click();
      return true;
    });
    if (!clicked) { await sleep(400); continue; }
    await sleep(600);
    const f = await page.evaluate(() => document.getElementById('rg-floor').textContent);
    floors = Math.max(floors, parseInt(f.match(/\d+/) ? f.match(/\d+/)[0] : '1'));
  }
  console.log('爬塔到达层数:', floors, '| 战斗截图:', battleShot ? '有' : '无');
  if (!battleShot) errors.push('未进入卡牌战斗');
  await page.screenshot({ path: SHOT('c2-after-rogue') });

  await browser.close();
  if (errors.length) { console.log('问题:'); errors.forEach(e => console.log(' ✗', e)); process.exit(1); }
  console.log('卡牌战斗测试通过');
})().catch(e => { console.error('失败:', e.stack); process.exit(1); });
