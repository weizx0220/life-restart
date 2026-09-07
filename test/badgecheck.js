const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--disable-gpu'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('file:///C:/Users/魏/life-restart/index.html', { waitUntil: 'networkidle0' });
  await sleep(1200);
  await p.evaluate(() => {
    Save.data.achievements = ['ac_age60', 'ac_age80', 'ac_age100'];
    UI.renderGallery('achievements');
    document.querySelector('[data-tab="achievements"]') && document.querySelectorAll('#overlay-gallery .tab').forEach(t => t.classList.remove('active'));
    document.getElementById('overlay-gallery').classList.remove('hidden');
  });
  await sleep(400);
  await p.screenshot({ path: 'test/shots/svg_badge.png' });
  await b.close();
})();
