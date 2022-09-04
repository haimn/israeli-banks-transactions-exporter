const israeliBankScrapers = require('israeli-bank-scrapers');

async function scrape(options, credentials) {
  try {
    const scraper = israeliBankScrapers.createScraper(options);
    const scrapeResult = await scraper.scrape(credentials);

    if (scrapeResult.success) {
      return scrapeResult.accounts.flatMap(account => account.txns);
    }
    else {
      throw new Error(scrapeResult.errorMessage);
    }
  } catch(e) {
    console.error(`CompanyId: ${options.companyId}: scraping failed for the following reason: ${e.message}`);
    return [];
  }
}

module.exports.scrape = scrape;