const scrape = require('./scrape');
const firefly = require('./fireflyOutput');
const csvOutput = require('./csvOutput');
const accounts = require('./accounts.json');
var fs = require('fs');
var parse = require('csv-parse/lib/sync');
var lastSync = require('./lastSync.json');

var existingTransactions = {};

function generateId(transaction) {
  // replace last 4 chars of date with 0000
  transaction.date = transaction.date.substring(0, transaction.date.length - 4) + '000Z';
  return `${transaction.date}-${transaction.description}-${transaction.identifier}-${transaction.chargedAmount}`
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Read previous transactions
accounts.forEach(account => {
  if (fs.existsSync(`./${account.niceName}.csv`)) {
    var data = fs.readFileSync(`./${account.niceName}.csv`, 'utf8');
    var parsedData = parse(data, { columns: true, delimiter: ',' });
    parsedData.forEach(transaction => {
      existingTransactions[generateId(transaction)] = transaction;
    });
  }
});

(async () => {
  await Promise.all(accounts.filter(account => account.enabled).map(account => {
    console.log(`Start scraping account ${account.niceName}`);
    scrape.scrape({
    niceName: account.niceName,
    companyId: account.companyId,
    startDate: addDays(new Date(lastSync[account.niceName]), -14),
    combineInstallments: false,
    showBrowser: true,
    defaultTimeout: 60000
  }, account.credentials)
    .then(trans => {
	    trans = trans.filter(transaction => transaction.status != 'pending' && !(generateId(transaction) in existingTransactions));
    console.log(`Found ${trans.length} transaction for account ${account.niceName}`);
    return trans;})
    .then(trans => csvOutput.writeToCsv(trans, `${account.niceName}.csv`))
    .then(trans => firefly.addTransactions(trans, account.niceName))
    .then(trans => {
      if (trans.length > 0) {
        lastSync[account.niceName] = new Date();
        // store last account syncDate to file
        fs.writeFile('lastSync.json', JSON.stringify(lastSync), { encoding: 'utf8', flag: 'w' }, (err) => {
          if (err)
            console.log(err);
          else {
            console.log("File written successfully\n");
          }
        });
      }
      return trans;
    })
  }));
})();
