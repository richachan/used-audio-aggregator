import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req.query;

  if (typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: 'Invalid query' });
  }

  const searchUrl = `https://www.head-fi.org/search/39110786/?q=${encodeURIComponent(query)}&t=hfc_listing&c[categories][0]=1&c[child_categories]=1&o=date`;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.block-row'); // Ensure the content loads

    const listings = await page.evaluate(() => {
      const results = [];
      
      document.querySelectorAll('.block-row').forEach((item) => {
        const titleElement = item.querySelector('.contentRow-title a');
        const priceElement = item.querySelector('.contentRow-extra dd');
        
        const title = titleElement ? titleElement.textContent.trim() : '';
        const link = titleElement ? `https://www.head-fi.org${titleElement.getAttribute('href')}` : '';
        const price = priceElement ? priceElement.textContent.trim() : null;

        if (title && link) {
          results.push({ title, link, price });
        }
      });
      
      return results;
    });

    await browser.close();
    res.status(200).json(listings);
  } catch (error) {
    console.error("Scraping error:", error);
    await browser.close();
    res.status(500).json({ error: 'Failed to retrieve listings' });
  }
}
