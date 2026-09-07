const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1300);
  await p.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await p.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  await p.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);
  // 第一世：买产业 + 攒钱 → 直接终局
  await p.evaluate(() => {
    const L = Game.life();
    L.coin = 1000;
    L.biz = { bz_milktea: { lv: 2, since: 0 } };   // 残值 (150+120)*0.6=162
    L.deathText = '寿终';
  });
  // 直接调 doFinish 等效流程：通过接受死亡
  await p.evaluate(() => { Game.life().adUsed = true; Game.life().attr.str = 0; });
  // 触发终局：推进一年直到死（str=0 触发病死），或调内部——用 afterYear 不可达，改走 btn-next 循环
  for (let i = 0; i < 200; i++) {
    const dead = await p.evaluate(() => { const b = document.getElementById('btn-next'); b && b.click(); return !!document.querySelector('#screen-summary.active'); });
    if (dead) break;
    // 处理选项/续命弹窗
    await p.evaluate(() => {
      const c = document.querySelector('#choice-options button'); if (c) c.click();
      if (!document.getElementById('overlay-battle').classList.contains('hidden')) Combat.concede();
      if (!document.getElementById('overlay-revive').classList.contains('hidden')) document.getElementById('btn-accept-death').click();
    });
    await sleep(250);
  }
  const summary = await p.evaluate(() => document.querySelector('#screen-summary.active') ? document.getElementById('summary-reward').textContent : '未到结算');
  console.log('结算:', summary);
  const inheritSaved = await p.evaluate(() => Save.data.legacy.inherit);
  console.log('存档遗产:', inheritSaved);
  // 再开一世验证继承
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('再入轮回')); if (b) b.click(); }); await sleep(500);
  await p.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  await p.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);
  const coin2 = await p.evaluate(() => Game.life().coin);
  console.log('第二世开局盘缠:', coin2, '(30 + 继承', inheritSaved, '=', 30 + inheritSaved, ')');
  console.log(coin2 === 30 + inheritSaved ? '继承 PASS' : '继承 FAIL');
  await b.close();
})();
