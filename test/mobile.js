/* 手机视口 + 多档案系统 端到端测试 */
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const SHOT = (n) => 'C:/Users/魏/life-restart/test/shots/' + n + '.png';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--disable-gpu']
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('页面异常: ' + e.message));

  // 兼容的点击：优先 tap，失败则 DOM click
  async function tap(sel) {
    try { await page.tap(sel); }
    catch (e) { await page.evaluate(s => document.querySelector(s).click(), sel); }
  }

  // === 手机视口 390x844 ===
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(2200);
  await page.screenshot({ path: SHOT('m1-title') });

  await tap('#btn-start');
  await sleep(600);
  await page.screenshot({ path: SHOT('m1b-hero') });
  let hcs = await page.$$('.hero-card');
  await hcs[0].tap().catch(async () => { await page.evaluate(() => document.querySelectorAll('.hero-card')[0].click()); });
  await sleep(600);
  await page.screenshot({ path: SHOT('m1c-world') });
  let wcs = await page.$$('.world-card');
  await wcs[0].tap().catch(async () => { await page.evaluate(() => document.querySelectorAll('.world-card')[0].click()); });
  await sleep(1800);
  await page.screenshot({ path: SHOT('m2-draw') });
  const cards = await page.$$('.tcard');
  await cards[0].tap(); await cards[1].tap(); await cards[2].tap(); await sleep(300);
  await tap('#btn-draw-ok'); await sleep(600);
  await page.screenshot({ path: SHOT('m3-alloc') });
  await tap('#btn-random-alloc'); await sleep(300);
  await tap('#btn-alloc-ok'); await sleep(600);

  // 推进若干年，覆盖一次选项事件
  for (let i = 0; i < 30; i++) {
    await tap('#btn-next'); await sleep(300);
    const waiting = await page.evaluate(() => !document.getElementById('choice-box').classList.contains('hidden'));
    if (waiting) break;
  }
  await sleep(400);
  await page.screenshot({ path: SHOT('m4-life-choice') });

  // 选项框是否在时间轴内可视（不需要滚动 main）
  const visible = await page.evaluate(() => {
    const box = document.getElementById('choice-box');
    const tl = document.getElementById('life-timeline');
    const r = box.getBoundingClientRect(), tr = tl.getBoundingClientRect();
    return box.classList.contains('hidden') || (r.top >= tr.top && r.bottom <= tr.bottom + 5);
  });
  if (!visible) errors.push('手机端选项框未完全可视');

  // 自动跑完一生
  await page.evaluate(() => { const b = [...document.querySelectorAll('.choice-opt')].filter(x => !x.disabled); if (b.length) b[0].click(); });
  await page.select('#auto-speed', '300');
  await tap('#btn-auto');
  let steps = 0;
  while (steps++ < 700) {
    await sleep(220);
    const st = await page.evaluate(() => ({
      choice: !document.getElementById('choice-box').classList.contains('hidden'),
      summary: document.getElementById('screen-summary').classList.contains('active'),
      revive: !document.getElementById('overlay-revive').classList.contains('hidden')
    }));
    if (st.revive) { await page.evaluate(() => document.getElementById('btn-accept-death').click()); await sleep(600); continue; }
    if (st.summary) break;
    if (st.choice) await page.evaluate(() => { const b = [...document.querySelectorAll('.choice-opt')].filter(x => !x.disabled); if (b.length) b[0].click(); });
  }
  await sleep(1500);
  await page.screenshot({ path: SHOT('m5-summary') });
  const summaryActive = await page.$eval('#screen-summary', el => el.classList.contains('active'));
  if (!summaryActive) errors.push('手机端未跑完一生');

  // === v2 手机端：地图 / 副本 / 战斗 / 背包 ===
  const onSummary = await page.evaluate(() => document.getElementById('screen-summary').classList.contains('active'));
  if (onSummary) {
    await page.evaluate(() => document.getElementById('btn-again').click());
    await sleep(700);
    await page.evaluate(() => document.querySelectorAll('.hero-card')[1].click());  // 模板
    await sleep(600);
    await page.evaluate(() => document.querySelectorAll('.world-card')[1].click());
    await sleep(900);
    await page.screenshot({ path: SHOT('m7-tpl-life') });
    // 推进到 17 岁（攒行动点 + 解锁副本），途中处理选项
    let deadEarly = false;
    for (let y = 0; y < 45; y++) {
      const st = await page.evaluate(() => ({
        waiting: !document.getElementById('choice-box').classList.contains('hidden'),
        age: parseInt(document.getElementById('life-age-big').textContent) || 0,
        dead: document.getElementById('screen-summary').classList.contains('active')
      }));
      if (st.dead) { deadEarly = true; break; }
      if (st.age >= 17) break;
      if (st.waiting) {
        await page.evaluate(() => { const b = [...document.querySelectorAll('.choice-opt')].filter(x => !x.disabled); if (b.length) b[0].click(); });
      } else {
        await page.evaluate(() => document.getElementById('btn-next').click());
      }
      await sleep(250);
    }
    if (deadEarly) {
      console.log('（本轮模板人生早夭，跳过副本/战斗截图）');
    } else {
    // 地图
    await page.evaluate(() => document.getElementById('btn-map').click());
    await sleep(500);
    await page.screenshot({ path: SHOT('m8-map') });
    // 副本列表
    await page.evaluate(() => {
      const d = [...document.querySelectorAll('[data-act]')].find(b => b.getAttribute('data-act') === 'dungeon');
      if (d) d.click();
    });
    await sleep(500);
    await page.screenshot({ path: SHOT('m9-dungeons') });
    // 打第一个副本看战斗界面
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('#map-actions .map-act button')].find(x => !x.disabled && x.textContent === '挑战');
      if (b) b.click();
    });
    await sleep(800);
    const inBattle = await page.evaluate(() => !document.getElementById('overlay-battle').classList.contains('hidden'));
    if (inBattle) {
      await page.screenshot({ path: SHOT('m10-battle') });
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => { const s = [...document.querySelectorAll('.bt-skill')].find(x => !x.disabled); if (s) s.click(); });
        await sleep(900);
      }
      await page.screenshot({ path: SHOT('m11-battle-mid') });
      // 收尾：打完或撤退
      for (let b = 0; b < 80; b++) {
        const st = await page.evaluate(() => {
          const ov = document.getElementById('overlay-battle');
          if (ov.classList.contains('hidden')) return 'none';
          const endBtn = [...ov.querySelectorAll('.ink-btn')].find(x => x.textContent === '凯旋' || x.textContent === '撤退');
          if (endBtn) { endBtn.click(); return 'ended'; }
          const sk = [...ov.querySelectorAll('.bt-skill')].find(x => !x.disabled);
          if (sk) sk.click();
          return 'fighting';
        });
        if (st === 'none' || st === 'ended') break;
        await sleep(350);
      }
    } else {
      errors.push('手机端未能进入副本战斗');
    }
    }   // end else（未早夭）
    // 关掉所有弹层，避免遮挡后续操作
    await page.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden')));
  }

  // === 多档案系统 ===
  await tap('#btn-profile');
  await sleep(400);
  await page.screenshot({ path: SHOT('m6-profile') });
  await page.type('#profile-name', '朋友甲');
  await tap('#btn-profile-new');
  await sleep(600);
  const name1 = await page.$eval('#btn-profile', el => el.textContent);
  if (name1 !== '朋友甲') errors.push('新建档案后当前档案名异常: ' + name1);
  // 新档案应是空档
  const fresh = await page.evaluate(() => JSON.parse(localStorage.getItem('life_restart_profiles_v1')).list.length);
  if (fresh !== 2) errors.push('档案列表数量异常: ' + fresh);
  const newSave = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('life_restart_profiles_v1'));
    return localStorage.getItem('life_restart_save_v1_' + p.current);
  });
  if (!newSave || JSON.parse(newSave).stats.lives !== 0) errors.push('新档案不是空档');
  // 切回无名氏，数据应还在
  await tap('#btn-profile'); await sleep(300);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('[data-switch]')];
    if (btns.length) btns[0].click();
  });
  await sleep(600);
  const name2 = await page.$eval('#btn-profile', el => el.textContent);
  const lives2 = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('life_restart_profiles_v1'));
    return JSON.parse(localStorage.getItem('life_restart_save_v1_' + p.current)).stats.lives;
  });
  console.log('档案切换:', name2, '| 该档案历经', lives2, '世');
  if (name2 !== '无名氏' || lives2 < 1) errors.push('切回原档案后数据丢失');

  await browser.close();
  if (errors.length) {
    console.log('\n==== 发现问题 ====');
    errors.forEach(e => console.log(' ✗ ' + e));
    process.exit(1);
  }
  console.log('\n==== 手机端 + 多档案测试全部通过 ====');
})().catch(e => { console.error('测试执行失败:', e.stack); process.exit(1); });
