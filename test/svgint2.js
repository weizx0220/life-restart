const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1200);
  // 抽签界面（选自定义角色路线）
  await p.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await p.evaluate(() => document.querySelectorAll('.hero-card')[0].click()); await sleep(300);
  await p.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(700);
  await p.screenshot({ path: 'test/shots/svg_draw.png' });
  // 随便选天赋进入，切修仙世界看角纹
  await p.evaluate(() => { document.querySelectorAll('.tcard').forEach((c, i) => { if (i < 3) c.click(); }); }); await sleep(400);
  await p.evaluate(() => { const ok = document.getElementById('btn-draw-ok'); if (!ok.disabled) ok.click(); }); await sleep(500);
  // 分配属性确认（如果有）
  await p.evaluate(() => { const b2 = document.getElementById('btn-alloc-ok'); if (b2) b2.click(); }); await sleep(700);
  // 功业碑徽章（直接调渲染函数验证）
  await p.evaluate(() => {
    Save.data.achievements = Object.keys(Save.data.achievements || {}).length ? Save.data.achievements : [];
    UI.renderGallery('achievements');
    document.getElementById('overlay-gallery').classList.remove('hidden');
  }); await sleep(400);
  await p.screenshot({ path: 'test/shots/svg_gallery.png' });
  console.log(errs.length ? '报错:' + errs.join(';') : '无报错');
  await b.close();
})();
