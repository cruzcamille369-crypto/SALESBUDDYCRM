import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log("Page loaded successfully.");
    
    // Check if the page is empty
    const bodyContent = await page.evaluate(() => document.body.innerHTML.trim());
    if (bodyContent === '') {
        console.log("WARNING: Page body is empty (White Screen)!");
    } else {
        console.log("Page body has content length:", bodyContent.length);
        const text = await page.evaluate(() => document.body.innerText.trim());
        console.log("Visible text preview:", text.substring(0, 100).replace(/\n/g, ' '));
    }
  } catch (err) {
    console.log("Navigation error:", err.message);
  }
  
  await browser.close();
})();
