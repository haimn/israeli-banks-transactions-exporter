const israeliBankScrapers = require('israeli-bank-scrapers');

async function scrape(options, credentials) {
  try {
    const scraper = israeliBankScrapers.createScraper(options);
    const scrapeResult = await scraper.scrape(credentials);

    if (scrapeResult.success) {
      return scrapeResult.accounts.flatMap(account => account.txns);
    }
    else {
      throw new Error(scrapeResult.errorType);
    }
  } catch(e) {
    console.error(`${options.niceName}: scraping failed for the following reason: ${e.message}`);
    return [];
  }
}

module.exports.scrape = scrape;
