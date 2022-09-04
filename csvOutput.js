var fs = require('fs');
var stringify = require('csv-stringify');
    


async function writeToCsv(transactions, fileName) {
    stringify(transactions, {
        columns: [ "date","identifier","description","chargedAmount","installments","memo","originalAmount","originalCurrency","processedDate","status","type" ],
        header: !fs.existsSync(fileName)
    }, function (err, output) {
        fs.appendFile(fileName, output, (err) => {
            if (err) {
                console.log(err)
            }
        });
    });
    return transactions;
}

module.exports.writeToCsv = writeToCsv;