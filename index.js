const scrape = require('./scrape');
const firefly = require('./fireflyOutput');
const csvOutput = require('./csvOutput');
const accounts = require('./accounts.json');
const conf = require('./conf.json');
var fs = require('fs');
var parse = require('csv-parse/lib/sync');
var lastSync = require('./lastSync.json');

var existingTransactions = {};

function generateId(transaction) {
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
  await Promise.all(accounts.filter(account => account.enabled).map(account => scrape.scrape({
    companyId: account.companyId,
    startDate: addDays(new Date(lastSync[account.niceName]), -14),
    combineInstallments: false,
    showBrowser: true
  }, account.credentials)
    .then(trans => trans.filter(transaction => transaction.status != 'pending' && !(generateId(transaction) in existingTransactions)))
    .then(trans => csvOutput.writeToCsv(trans, `${account.niceName}.csv`))
    .then(trans => firefly.addTransactions(trans, account.niceName))
    .then(trans => {
      lastSync[account.niceName] = new Date();
      // store last account syncDate to file
      fs.writeFile('lastSync.json', JSON.stringify(lastSync), { encoding: 'utf8', flag: 'w' }, (err) => {
        if (err)
          console.log(err);
        else {
          console.log("File written successfully\n");
        }
      });
      return trans;
    })));
})();