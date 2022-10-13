const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const {v1: uuidv1} = require('uuid');

function Blockchain() {
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
    for (var i = 1; i<blockchain.length; i++) {
        const currBlock = blockchain[i];
        const prevBlock = blockchain[i-1];

        const blockHash = this.hashBlock(prevBlock['hash'], {transactions: currBlock['transactions'], index: currBlock['index']}, currBlock['nonce']);
        if (blockHash.substring(0, 4) !== '0000') {
            validChain = false;
        }

        if (currBlock['previousBlockHash'] !== prevBlock['hash']) { // chain not valid
            validChain = false;
        }
    };

    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 100;
    const correctHash = genesisBlock['hash'] == '0 ';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    if (!(correctHash && correctNonce && correctTransactions)) {
        validChain = false;
    }

    return validChain;
};

module.exports = Blockchain;