const pptr = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
pptr.use(StealthPlugin());

(async () => {
  const browser = await pptr.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080',
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
  );

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  console.log('Открываю Lamoda...');
  await page.goto('https://www.lamoda.ru/p/mp002xm00b1y/shoes-harryhatchet-botinki/', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(r => setTimeout(r, 5000));

  console.log('Title:', await page.title());

  // 1. data-size
  const dataSizes = await page.evaluate(() => {
    const els = document.querySelectorAll('[data-size]');
    return Array.from(els).slice(0, 20).map(el => ({
      tag: el.tagName,
      className: el.className.substring(0, 100),
      dataSize: el.getAttribute('data-size'),
      text: el.textContent.trim().substring(0, 50),
      disabled: el.hasAttribute('disabled'),
    }));
  });
  console.log('--- data-size ---');
  console.log('Найдено:', dataSizes.length);
  dataSizes.forEach(e => console.log(JSON.stringify(e)));

  // 2. Контейнеры с size
  const sizeContainers = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="size"]');
    return Array.from(els).slice(0, 30).map(el => ({
      tag: el.tagName,
      className: el.className.substring(0, 150),
      text: el.textContent.trim().substring(0, 80),
    }));
  });
  console.log('--- Контейнеры size ---');
  console.log('Найдено:', sizeContainers.length);
  sizeContainers.forEach(e => console.log(JSON.stringify(e)));

  // 3. Кнопки 30-50
  const sizeButtons = await page.evaluate(() => {
    const els = document.querySelectorAll('button, [role="option"], [tabindex]');
    const sizes = [];
    els.forEach(el => {
      const text = el.textContent.trim();
      const num = parseInt(text, 10);
      if (num >= 30 && num <= 50) {
        sizes.push({
          tag: el.tagName,
          className: el.className.substring(0, 150),
          text: text,
          parentClass: (el.parentElement && el.parentElement.className) ? el.parentElement.className.substring(0, 150) : '',
          disabled: el.hasAttribute('disabled'),
        });
      }
    });
    return sizes.slice(0, 30);
  });
  console.log('--- Кнопки 30-50 ---');
  console.log('Найдено:', sizeButtons.length);
  sizeButtons.forEach(e => console.log(JSON.stringify(e)));

  // Сохраняем HTML
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('lamoda_page.html', html, 'utf-8');
  console.log('HTML сохранён в lamoda_page.html');

  await browser.close();
})().catch(err => {
  console.error('Ошибка:', err.message);
  process.exit(1);
});
