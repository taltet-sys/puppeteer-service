// Puppeteer render service
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

let browser = null;

async function getBrowser() {
  if (!browser) {
    console.log('Starting browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
  }
  return browser;
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'puppeteer-render' });
});

app.post('/render', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }
  
  console.log(`Rendering: ${url}`);
  
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    const html = await page.content();
    await page.close();
    
    console.log(`Success: ${Math.round(html.length/1024)}KB`);
    
    res.json({
      success: true,
      html: html,
      size: html.length
    });
    
  } catch (error) {
    await page.close().catch(() => {});
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Service running on port ${PORT}`);
});

```
