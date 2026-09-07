const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844 });  // 手机视口
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('requestfailed', r => { if (!r.url().includes('chahua')) errs.push('资源失败: ' + r.url().split('/').pop()); });
  const t0 = Date.now();
  await p.goto('file:///C:/Users/魏/life-restart/_deploy/index.html', { waitUntil: 'networkidle0' });
  console.log('加载耗时(ms):', Date.now() - t0);
  await sleep(800);
  const titleOk = await p.evaluate(() => !!document.getElementById('btn-start'));
  await p.evaluate(() => document.getElementById('btn-start').click()); await sleep(400);
  await p.evaluate(() => document.querySelectorAll('.hero-card')[2].click()); await sleep(300);
  await p.evaluate(() => document.querySelectorAll('.world-card')[0].click()); await sleep(900);
  const inGame = await p.evaluate(() => document.getElementById('screen-life').classList.contains('active'));
  console.log('标题:', titleOk, '| 进入游戏:', inGame);
  console.log(errs.length ? '问题:\n' + errs.join('\n') : '无报错无资源缺失');
  await b.close();
})();
