/* 浏览器端端到端测试：驱动完整流程并截图 */
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'file:///C:/Users/魏/life-restart/index.html';
const SHOT = (n) => 'C:/Users/魏/life-restart/test/shots/' + n + '.png';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--disable-gpu', '--window-size=1440,900', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('pageerror', e => errors.push('页面异常: ' + e.message));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    // 音频文件缺失属预期（自动回退合成音），不算错误
    const loc = m.location();
    if (loc && loc.url && loc.url.indexOf('assets/audio') >= 0) return;
    if (/ERR_FILE_NOT_FOUND/.test(m.text())) return;
    errors.push('console.error: ' + m.text());
  });

  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(2500);
  await page.screenshot({ path: SHOT('01-title') });

  // 1. 进入身份选择 → 自定义 → 世界选择 → 抽卡
  await page.click('#btn-start');
  await sleep(600);
  await page.screenshot({ path: SHOT('01b-hero') });
  let heroCards = await page.$$('.hero-card');
  if (heroCards.length !== 4) errors.push('身份卡数量异常: ' + heroCards.length);
  await heroCards[0].click();   // 自定义命格
  await sleep(500);
  let worldCards = await page.$$('.world-card');
  if (worldCards.length !== 2) errors.push('世界卡数量异常: ' + worldCards.length);   // 现只开放都市+修仙
  await page.screenshot({ path: SHOT('01c-world') });
  await worldCards[0].click();  // 现实都市
  await sleep(1800);
  await page.screenshot({ path: SHOT('02-draw') });

  // 校验抽出 10 张卡
  const cardCount = await page.$$eval('.tcard', els => els.length);
  if (cardCount !== 10) errors.push('抽卡数量异常: ' + cardCount);

  // 2. 选 3 张
  const cards = await page.$$('.tcard');
  await cards[0].click(); await sleep(200);
  await cards[2].click(); await sleep(200);
  await cards[4].click(); await sleep(300);
  const okDisabled = await page.$eval('#btn-draw-ok', b => b.disabled);
  if (okDisabled) errors.push('选满3张后确认按钮仍禁用');
  await page.screenshot({ path: SHOT('03-draw-picked') });

  // 3. 属性分配：随机 + 确认
  await page.click('#btn-draw-ok');
  await sleep(600);
  await page.click('#btn-random-alloc');
  await sleep(400);
  await page.screenshot({ path: SHOT('04-alloc') });
  await page.click('#btn-alloc-ok');
  await sleep(800);
  await page.screenshot({ path: SHOT('05-life-start') });

  // 4. 自动播放一生（速度：快）；遇到选项自动点第一个可用项
  await page.select('#auto-speed', '300');
  await page.click('#btn-auto');
  let steps = 0;
  while (steps++ < 900) {
    await sleep(250);
    const state = await page.evaluate(() => {
      const choice = document.getElementById('choice-box');
      const choiceVisible = choice && !choice.classList.contains('hidden');
      const summary = document.getElementById('screen-summary').classList.contains('active');
      const revive = !document.getElementById('overlay-revive').classList.contains('hidden');
      return { choiceVisible, summary, revive };
    });
    if (state.revive) { await page.evaluate(() => document.getElementById('btn-accept-death').click()); await sleep(600); continue; }
    if (state.summary) break;
    if (state.choiceVisible) {
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('.choice-opt')].filter(b => !b.disabled);
        if (btns.length) btns[0].click();
      });
    }
  }
  await sleep(2200);
  await page.screenshot({ path: SHOT('06-summary') });
  const summaryActive = await page.$eval('#screen-summary', el => el.classList.contains('active'));
  if (!summaryActive) errors.push('人生跑完未进入总结页（步数 ' + steps + '）');

  const summaryText = await page.$eval('#summary-verdict', el => el.textContent);
  const endingText = await page.$eval('#summary-ending', el => el.textContent);
  console.log('结局:', endingText || '(空)', '| 判词:', summaryText.slice(0, 40));

  // 5. 图鉴 & 轮回殿
  await page.click('#btn-menu'); await sleep(200); await page.click('#btn-gallery');
  await sleep(400);
  await page.screenshot({ path: SHOT('07-gallery') });
  await page.click('.overlay-close[data-close="overlay-gallery"]');
  await sleep(200);
  await page.click('#btn-menu'); await sleep(200); await page.click('#btn-legacy');
  await sleep(400);
  await page.screenshot({ path: SHOT('08-legacy') });
  await page.click('.overlay-close[data-close="overlay-legacy"]');
  await sleep(300);

  // 5.5 再入轮回 → 应回到身份选择页
  await page.click('#btn-again');
  await sleep(800);
  const heroActive = await page.$eval('#screen-hero', el => el.classList.contains('active'));
  if (!heroActive) errors.push('再入轮回未回到身份选择页');

  // 5.6 模板流程：直接在当前身份页选模板 → 选世界 → 应直接进人生（跳过抽卡分配）
  let heroCards2 = await page.$$('.hero-card');
  await heroCards2[1].click();   // 第一个模板
  await sleep(500);
  let worldCards2 = await page.$$('.world-card');
  await worldCards2[0].click();  // 现实都市
  await sleep(900);
  const tplLife = await page.evaluate(() => document.getElementById('screen-life').classList.contains('active'));
  if (!tplLife) errors.push('模板流程未直接进入人生');
  const tplEquip = await page.evaluate(() => document.getElementById('life-equips').textContent);
  console.log('模板开局装备栏:', tplEquip.slice(0, 50));
  await page.screenshot({ path: SHOT('08b-template-life') });

  // 5.6 地图行动：都市世界应有生活类行动且无战斗副本；测学习充电（速算小游戏）
  await page.evaluate(() => { Game.life().age = 20; Game.refresh(); });
  await page.evaluate(() => document.getElementById('btn-map').click()); await sleep(400);
  await page.screenshot({ path: SHOT('08c-map') });
  const mapVisible = await page.$eval('#overlay-map', el => !el.classList.contains('hidden'));
  if (!mapVisible) errors.push('地图面板未打开');
  const actNames = await page.evaluate(() => [...document.querySelectorAll('#map-actions .l-name')].map(e => e.textContent).join(','));
  if (actNames.indexOf('学习充电') < 0) errors.push('都市世界缺少学习充电行动');
  if (actNames.indexOf('幽冥幻境') < 0) errors.push('缺少幽冥幻境');
  console.log('都市行动列表:', actNames);
  // 点学习充电 → 速算小游戏 → 自动答5题
  const intBefore = await page.evaluate(() => Game.life().attr.int);
  await page.evaluate(() => {
    const s = [...document.querySelectorAll('[data-act]')].find(b => b.getAttribute('data-act') === 'study');
    if (s) s.click();
  });
  await sleep(600);
  const miniOpen = await page.evaluate(() => !document.getElementById('overlay-mini').classList.contains('hidden'));
  if (!miniOpen) errors.push('速算小游戏未打开');
  await page.screenshot({ path: SHOT('08f-mathgame') });
  for (let q = 0; q < 6; q++) {
    await page.evaluate(() => {
      const opts = [...document.querySelectorAll('.mg-opt')];
      if (opts.length) opts[Math.floor(Math.random() * opts.length)].click();
    });
    await sleep(400);
  }
  await sleep(1600);
  const intAfter = await page.evaluate(() => Game.life().attr.int);
  if (intAfter <= intBefore) errors.push('学习后智力未提升');
  console.log('速算后智力:', intBefore, '→', intAfter);
  await page.screenshot({ path: SHOT('08d-after-action') });

  // localStorage 存档检查（多档案结构）
  const saveInfo = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('life_restart_profiles_v1') || 'null');
    if (!p) return null;
    const raw = localStorage.getItem('life_restart_save_v1_' + p.current);
    return raw ? JSON.parse(raw) : null;
  });
  if (!saveInfo) errors.push('localStorage 无存档');
  else {
    console.log('存档: 历经', saveInfo.stats.lives, '世 | 结局数', saveInfo.endings.length, '| 成就数', saveInfo.achievements.length, '| 轮回点', saveInfo.legacy.points);
    if (saveInfo.stats.lives < 1) errors.push('存档世数未记录');
  }

  await browser.close();
  if (errors.length) {
    console.log('\n==== 发现问题 ====');
    errors.forEach(e => console.log(' ✗ ' + e));
    process.exit(1);
  }
  console.log('\n==== 端到端测试全部通过 ====');
})().catch(e => { console.error('测试执行失败:', e.message); process.exit(1); });
