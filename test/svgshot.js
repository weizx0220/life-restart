const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 1100, height: 1000 });
  await p.goto('file:///C:/Users/魏/life-restart/test/svgpreview.html');
  await new Promise(r => setTimeout(r, 800));
  await p.screenshot({ path: 'test/shots/svg_preview.png' });
  await b.close();
})();
