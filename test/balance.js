/* 肉鸽平衡测试：智能策略自动打 3 局爬塔，输出每场战斗的损耗与层数 */
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', e => console.log('PAGEERR:', e.message));
  await page.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1500);

  const RUNS = 3;
  for (let run = 0; run < RUNS; run++) {
    // 模板开局 → 都市
    await page.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
    await page.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
    await page.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(800);

    let log = [];
    // 循环开塔直到行动点耗尽或死亡
    for (let tower = 0; tower < 3; tower++) {
      await page.evaluate(() => document.getElementById('btn-map').click()); await sleep(300);
      const can = await page.evaluate(() => {
        const r = [...document.querySelectorAll('[data-act]')].find(x => x.getAttribute('data-act') === 'rogue');
        if (r && !r.disabled) { r.click(); return true; }
        document.getElementById('overlay-map').classList.add('hidden');
        return false;
      });
      if (!can) break;
      await sleep(500);

      // 爬塔循环
      for (let step = 0; step < 300; step++) {
        const st = await page.evaluate(() => {
          const rogue = !document.getElementById('overlay-rogue').classList.contains('hidden');
          const battle = !document.getElementById('overlay-cbattle').classList.contains('hidden');
          const revive = !document.getElementById('overlay-revive').classList.contains('hidden');
          return { rogue, battle, revive };
        });
        if (st.revive) { await page.evaluate(() => document.getElementById('btn-accept-death').click()); await sleep(500); break; }
        if (!st.rogue && !st.battle) break;

        if (st.battle) {
          // 智能出牌：敌方意图含攻击 → 优先格挡/回血，否则打最大伤害
          const acted = await page.evaluate(() => {
            const ov = document.getElementById('overlay-cbattle');
            const endBtn = [...ov.querySelectorAll('.ink-btn')].find(x => x.textContent === '凯旋' || x.textContent === '撤退');
            if (endBtn) { endBtn.click(); return 'end'; }
            const intent = document.getElementById('cbi-intent').textContent;
            const cards = [...document.querySelectorAll('.cb-card:not(.disabled)')];
            if (!cards.length) { document.getElementById('cb-endturn').click(); return 'endturn'; }
            let pick = null;
            if (intent.indexOf('攻击') >= 0) {
              pick = cards.find(c => c.textContent.indexOf('格挡') >= 0) ||
                     cards.find(c => c.textContent.indexOf('回复') >= 0);
            }
            if (!pick) {
              // 打描述里百分比最高的攻击牌
              let best = -1;
              cards.forEach(c => {
                const m = c.textContent.match(/(\d+)%/);
                if (m && c.textContent.indexOf('伤害') >= 0 && parseInt(m[1]) > best) { best = parseInt(m[1]); pick = c; }
              });
              if (!pick) pick = cards[0];
            }
            pick.click();
            return 'play';
          });
          await sleep(acted === 'end' ? 500 : 380);
          continue;
        }

        // 幻境界面：读血量，选节点
        const info = await page.evaluate(() => {
          const hp = document.getElementById('rg-hp').textContent;
          const nodes = [...document.querySelectorAll('.rg-node')];
          if (!nodes.length) return { hp, clicked: false };
          const fight = nodes.find(n => n.className.includes('rg-elite')) ||
                        nodes.find(n => n.className.includes('rg-fight')) ||
                        nodes.find(n => n.className.includes('rg-boss'));
          (fight || nodes[0]).click();
          return { hp, clicked: true, label: (fight || nodes[0]).textContent.slice(0, 10) };
        });
        if (info.clicked) log.push(info.hp + ' 进[' + info.label.trim() + ']');
        await sleep(700);
      }
    }
    console.log('--- 第 ' + (run + 1) + ' 局 ---');
    log.forEach(l => console.log('  ' + l));
    // 回标题开新局
    await page.evaluate(() => {
      document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    });
    await page.evaluate(() => { const b = document.getElementById('btn-home'); if (b) b.click(); });
    await sleep(400);
  }
  await browser.close();
  console.log('\n平衡测试完成');
})().catch(e => { console.error(e.stack); process.exit(1); });
