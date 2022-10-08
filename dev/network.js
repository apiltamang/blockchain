var express = require('express');
var app = express();
const parser = require('body-parser');
const Blockchain = require('./blockchain');
const {v1: uuidv1} = require('uuid');
const bitcoin = new Blockchain();
const port = process.argv[2];


const nodeAddress = uuidv1().split('-').join('');
app.use(parser.json());
app.use(parser.urlencoded({ extended: false }));

app.get('/blockchain', function (req, res) {
    res.send(bitcoin);
});

app.post('/transaction', function (req, res) {
    console.log("request: ", JSON.stringify(req.body));
    const blockIndex = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    res.json({ note: `transaction will be added in block ${blockIndex}`});
});

app.get('/mine', function (req, res) {
    const prevBlock = bitcoin.getLastBlock();
    const prevHash = prevBlock['hash'];

    const currData = {
        transactions: bitcoin.pendingTransactions,
        index: prevBlock['index'] + 1
    };

    const nonce = bitcoin.proofOfWork(prevHash, currData);
    const currHash = bitcoin.hashBlock(prevHash, currData, nonce);

    bitcoin.createNewTransaction(12.5, "00", nodeAddress);
    const newBlock = bitcoin.createNewBlock(nonce, prevHash, currHash);
    res.json({
        note: 'New block mined successfully',
        block: newBlock
    })
});

app.listen(port, function () {
    console.log(`listening on port ${port}...`);
});