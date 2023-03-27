const axios = require('axios');
const conf = require('./conf.json');

const fireflyHostInstance = axios.create({
    baseURL: `${conf.hostname}/`,
    headers: {Authorization: `Bearer ${conf.token}`}
  });

function generateFireflyTransaction(transaction, assetAccountId, assetAccountName) {
    if (transaction.chargedAmount < 0) {
        transaction.chargedAmount = -transaction.chargedAmount;
        transaction.type = 'withdrawal';
        transaction.source_id = `${assetAccountId}`;
        transaction.source_name = `${assetAccountName}`;
        // transaction.destination_id = "6";
        transaction.destination_name = `${transaction.description}`;
    }
    else {
        transaction.type = 'deposit';
        // transaction.source_id = "5";
        transaction.source_name = `${transaction.description}`;
        transaction.destination_id = `${assetAccountId}`;
        transaction.destination_name = `${assetAccountName}`;

    }

    fireflyTransaction = {
        amount: transaction.chargedAmount,
        date: transaction.date,
        description: transaction.description,
        external_id: transaction.identifier,
        type: transaction.type,
        notes: transaction.memo,
        process_date: transaction.processedDate,
        source_id: transaction.source_id,
        source_name: transaction.source_name,
        destination_id: transaction.destination_id,
        destination_name: transaction.destination_name,
        tags: [`Imported ${new Date().toDateString()}`],
        foreign_amount: transaction.originalAmount,
        foreign_currency_code: transaction.originalCurrency,
    }
    if (transaction.originalCurrency != 'ILS') {
        fireflyTransaction.foreign_amount = transaction.originalAmount;
        fireflyTransaction.foreign_currency_code = transaction.originalCurrency;
    }
    return fireflyTransaction;
}

async function getAccountId(accountName, type) {
    return fireflyHostInstance.get(`/api/v1/search/accounts`, { params: { query: accountName, field: "name", type: type } }).then(res => {
        if (res.data && res.data.data.length > 0) {
            return res.data.data[0].id;
        }
        else {
            return null;
        }
    }).catch(err => {
        console.log(err);
    }
    );
}

async function createAccount(accountName, type) {
    return fireflyHostInstance.post(`/api/v1/accounts`, {
        "name": `${accountName}`,
        "type": `${type}`,
        "currency_code": "ILS",
        "active": true,
        "account_role": "defaultAsset",
    }).then(res => {
        return res.data.data.id;
    }
    ).catch(err => {
        console.log(err);
    }
    );
}


function postTransactions(transactions, assetAccountId, assetAccountName) {
    Promise.all(transactions.filter(transaction => transaction.status == 'completed').map(transaction => {
        fireflyTransaction = generateFireflyTransaction(transaction, assetAccountId, assetAccountName);
        fireflyHostInstance.post(`/api/v1/transactions`,
            {
                error_if_duplicate_hash: false,
                apply_rules: true,
                fire_webhooks: true,
                transactions: [fireflyTransaction]
            })
            .then(res => {
                console.log(`statusCode: ${res.status}`);
            })
            .catch(error => {
                console.error(error);
            })
    }))
    return transactions;                    
}

async function addTransactions(transactions, accountId) {
    getAccountId(accountId, "asset").then(
        assetAccountId => {
            if (assetAccountId == null) {
                createAccount(accountId, "asset").then(
                    assetAccountId => {
                        postTransactions(transactions, assetAccountId, accountId);
                    });
            }
            else {
                postTransactions(transactions, assetAccountId, accountId);
            }
        }
    ).catch(err => {
        console.log(err);
    }
    );
    return transactions;
}

module.exports.addTransactions = addTransactions;