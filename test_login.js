import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE EXCEPTION:', error.message));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));
  
  // Try to find the login button and click it
  const loginBtn = await page.$('button[type="submit"], button');
  if (loginBtn) {
      console.log("Clicking login...");
      await loginBtn.click();
      await new Promise(r => setTimeout(r, 4000));
      const text = await page.evaluate(() => document.body.innerText.trim());
      console.log("After login preview:", text.substring(0, 100).replace(/\n/g, ' '));
      const bodyContent = await page.evaluate(() => document.body.innerHTML.trim());
      if (bodyContent === '') {
          console.log("WARNING: Page body is empty (White Screen) after login!");
      }
  } else {
      console.log("Login button not found.");
  }
  
  await browser.close();
})();
