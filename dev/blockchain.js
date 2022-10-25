const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const {v1: uuidv1} = require('uuid');
const sampleBlock = require('./sample.json');

function Blockchain() {
    if (currentNodeUrl === "http://localhost:3001") {
       this.chain = sampleBlock.chain;
       this.pendingTransactions = sampleBlock.pendingTransactions;
       this.networkNodes = sampleBlock.networkNodes;
       this.currentNodeUrl = currentNodeUrl;
       return;
    }
    this.chain = [];
    this.pendingTransactions = [];
    this.createNewBlock(100, '0', '0');
    this.networkNodes = [];
    this.currentNodeUrl = currentNodeUrl;
}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    const newBlock = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.pendingTransactions,
      nonce: nonce,
      hash: hash,
      previousBlockHash: previousBlockHash
  };

  this.pendingTransactions = [];
  this.chain.push(newBlock);

  return newBlock;
};

Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuidv1().split('-').join('')
    };
    return newTransaction;
};

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
    const data = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(data);
    return hash;
};

Blockchain.prototype.proofOfWork = function(previousHash, currData) {
    let nonce = 0;
    let hash = 'ABCD';
    while (hash.substring(0, 4) !== '0000') {
        nonce++;
        hash = this.hashBlock(previousHash, currData, nonce);
    }
    return nonce;
};

Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj) {
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
};

Blockchain.prototype.chainIsValid = function(blockchain) {
    let validChain = true;
    for (let i = 1; i<blockchain.length; i++) {
        const currBlock = blockchain[i];
        const prevBlock = blockchain[i-1];

        const blockHash = this.hashBlock(prevBlock['hash'], {transactions: currBlock['transactions'], index: currBlock['index']}, currBlock['nonce']);
        if (blockHash.substring(0, 4) !== '0000') {
            console.log("blockHash doesnt start with 0000");
            validChain = false;
        }

        if (currBlock['previousBlockHash'] !== prevBlock['hash']) { // chain not valid
            console.log("currBlock's prvious hash isn't equal to prev block hash");
            validChain = false;
        }
    };

    console.log("genesis block is: ", blockchain[0]);
    const genesisBlock = blockchain[0];
    const correctNonce = 100 === genesisBlock['nonce'];
    const correctHash = '0' === genesisBlock['hash'];
    const correctTransactions = genesisBlock['transactions'].length === 0;

    if (!(correctHash && correctNonce && correctTransactions)) {
        validChain = false;
    }

    return validChain;
};

Blockchain.prototype.getTransaction = function(transactionId) {
    let correctTransaction = null;
    let correctBlock = null;

    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if (transaction.transactionId === transactionId) {
                correctTransaction = transaction;
                correctBlock = block;
            };
        });
    });

    return {
        transaction: correctTransaction,
        block: correctBlock
    };
};

Blockchain.prototype.getAddressData = function(address) {
    const addressTransactions = [];
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if(transaction.sender === address || transaction.recipient === address) {
                addressTransactions.push(transaction);
            };
        });
    });

    let balance = 0;
    addressTransactions.forEach(transaction => {
        if (transaction.recipient === address) balance += transaction.amount;
        else if (transaction.sender === address) balance -= transaction.amount;
    });

    return {
        addressTransactions: addressTransactions,
        addressBalance: balance
    };
};

Blockchain.prototype.getBlock = function(blockHash) {
    let correctBlock = null;
    this.chain.forEach(block => {
        if (block.hash === blockHash) correctBlock = block;
    });
    return correctBlock;
};

module.exports = Blockchain;