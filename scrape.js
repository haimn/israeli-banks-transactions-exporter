const israeliBankScrapers = require('israeli-bank-scrapers');

async function scrape(options, credentials) {
  try {
    const scraper = israeliBankScrapers.createScraper(options);
    const scrapeResult = await scraper.scrape(credentials);

    if (scrapeResult.success) {
      if (!options.accountNumber) {
        return scrapeResult.accounts.flatMap(account => account.txns);
      }
      else {
        return scrapeResult.accounts.find(account => account.accountNumber == options.accountNumber).txns;
      }
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
