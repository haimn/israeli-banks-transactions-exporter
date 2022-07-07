import { CompanyTypes, createScraper } from 'israeli-bank-scrapers';

(async function() {
  try {
    // read documentation below for available options
    const options = {
      companyId: CompanyTypes.leumi, 
      startDate: new Date('2020-05-01'),
      combineInstallments: false,
      showBrowser: true 
    };

    // read documentation below for information about credentials
    const credentials = {
      username: 'vr29485',
      password: 'sometingsomething'
    };

    const scraper = createScraper(options);
    const scrapeResult = await scraper.scrape(credentials);

    if (scrapeResult.success) {
      scrapeResult.accounts.forEach((account) => {
        console.log(`found ${account.txns.length} transactions for account number ${account.accountNumber}`);
      });
    }
    else {
      throw new Error(scrapeResult.errorType);
    }
  } catch(e) {
    console.error(`scraping failed for the following reason: ${e.message}`);
  }
})();
