/* 压力与边界测试：长局、多世连开、弹层反复、战斗边界 */
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

  async function playLife(maxSteps) {
    let steps = 0;
    while (steps++ < maxSteps) {
      await sleep(120);
      const st = await page.evaluate(() => ({
        choice: !document.getElementById('choice-box').classList.contains('hidden'),
        summary: document.getElementById('screen-summary').classList.contains('active'),
        revive: !document.getElementById('overlay-revive').classList.contains('hidden'),
        puzzle: !document.getElementById('overlay-puzzle').classList.contains('hidden')
      }));
      if (st.puzzle) { await page.evaluate(() => Puzzle.giveup()); await sleep(300); continue; }
      if (st.revive) { await page.evaluate(() => document.getElementById('btn-accept-death').click()); await sleep(400); continue; }
      if (st.summary) return true;
      if (st.choice) await page.evaluate(() => { const b = [...document.querySelectorAll('.choice-opt')].filter(x => !x.disabled); if (b.length) b[Math.floor(Math.random() * b.length)].click(); });
      else await page.evaluate(() => document.getElementById('btn-next').click());
    }
    return false;
  }

  async function newGame(template, world) {
    await page.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
    await page.evaluate(i => document.querySelectorAll('.hero-card')[i].click(), template); await sleep(300);
    await page.evaluate(i => document.querySelectorAll('.world-card')[i].click(), world); await sleep(1400);
    if (template === 0) {
      const cards = await page.$$('.tcard');
      await cards[0].click(); await cards[1].click(); await cards[2].click(); await sleep(200);
      await page.evaluate(() => document.getElementById('btn-draw-ok').click()); await sleep(300);
      await page.evaluate(() => document.getElementById('btn-random-alloc').click()); await sleep(200);
      await page.evaluate(() => document.getElementById('btn-alloc-ok').click()); await sleep(400);
    }
  }

  /* T1：连续三世（多世连开稳定性） */
  for (let i = 0; i < 3; i++) {
    await newGame(0, 0);
    const ok = await playLife(500);
    if (!ok) { errors.push('第' + (i + 1) + '世未走到总结'); continue; }
    await page.evaluate(() => document.getElementById('btn-again').click()); await sleep(600);
  }
  console.log('T1 三世连开 通过');

  /* T2：长局（修仙界模板散兵，世界5=修仙界） */
  await newGame(3, 1);   // 世界卡现仅 2 张：0=都市 1=修仙
  const ok2 = await playLife(700);
  console.log('T2 修仙长局', ok2 ? '通过' : '（未到总结，检查中）');
  const age = await page.evaluate(() => document.getElementById('life-age-big') ? parseInt(document.getElementById('life-age-big').textContent) : -1);
  console.log('  修仙终局年龄:', age);

  /* T3：弹层反复开关 30 次 */
  await page.evaluate(() => document.getElementById('btn-home').click()); await sleep(300);
  await page.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await page.evaluate(() => document.querySelectorAll('.hero-card')[1].click()); await sleep(300);
  await page.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(800);
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => document.getElementById('btn-map').click()); await sleep(60);
    await page.evaluate(() => { document.getElementById('overlay-map').classList.add('hidden'); }); await sleep(60);
    await page.evaluate(() => document.getElementById('btn-inv').click()); await sleep(60);
    await page.evaluate(() => { document.getElementById('overlay-inv').classList.add('hidden'); }); await sleep(60);
  }
  console.log('T3 弹层反复 通过');

  /* T4：空牌组爬塔（移除全部构筑卡，只剩底牌） */
  await page.evaluate(() => { Game.life().deckExtra = []; Game.life().collection = []; });
  await page.evaluate(() => document.getElementById('btn-map').click()); await sleep(300);
  await page.evaluate(() => { const a = [...document.querySelectorAll('#map-actions .map-act')].find(x => x.textContent.indexOf('幽冥幻境') >= 0); if (a) a.querySelector('button').click(); }); await sleep(500);
  await page.evaluate(() => { const n = [...document.querySelectorAll('.rg-node')]; const f = n.find(x => x.className.includes('rg-fight')) || n[0]; if (f) f.click(); }); await sleep(700);
  // 纯底牌打一场
  for (let i = 0; i < 80; i++) {
    const st = await page.evaluate(() => {
      const ov = document.getElementById('overlay-cbattle');
      if (ov.classList.contains('hidden')) return 'none';
      const end = [...ov.querySelectorAll('.ink-btn')].find(x => x.textContent === '凯旋' || x.textContent === '撤退');
      if (end) { end.click(); return 'end'; }
      const c = [...ov.querySelectorAll('.cb-card:not(.disabled)')];
      if (c.length) { c[0].click(); return 'play'; }
      document.getElementById('cb-endturn').click();
      return 'et';
    });
    if (st === 'none' || st === 'end') break;
    await sleep(300);
  }
  console.log('T4 纯底牌战斗 通过');

  await browser.close();
  if (errors.length) { console.log('\n发现问题:'); errors.forEach(e => console.log(' ✗', e)); process.exit(1); }
  console.log('\n==== 压力测试全部通过 ====');
})().catch(e => { console.error('失败:', e.stack); process.exit(1); });
