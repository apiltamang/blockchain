var express = require('express');
var app = express();
const parser = require('body-parser');
const Blockchain = require('./blockchain');
const {v1: uuidv1} = require('uuid');
const bitcoin = new Blockchain();
const port = process.argv[2];
const rp = require('request-promise');

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


app.post('/register-and-broadcast-node', function(req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1) {
        bitcoin.networkNodes.push(newNodeUrl)
    }

    const registerNodesPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        // hit the register-node api
        const options = {
            uri: networkNodeUrl + "/register-node",
            method: 'POST',
            body: {
                newNodeUrl: newNodeUrl
            },
            json: true
        };

        registerNodesPromises.push(rp(options));
    });

    Promise.all(registerNodesPromises)
        .then(data => {
            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: {
                    allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]
                },
                json: true
            };
            return rp(bulkRegisterOptions);
        })
        .then(data => {
            res.send(data);
        });
});

app.post('/register-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;

    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = newNodeUrl !== bitcoin.currentNodeUrl;

    if (!nodeNotAlreadyPresent) {
        res.json( {note: `provided node: ${newNodeUrl} is already present`})
    }
    
    if (!notCurrentNode) {
        res.json( {note: `provided node: ${newNodeUrl} is current node`})
    }
    if (nodeNotAlreadyPresent && notCurrentNode) {
        bitcoin.networkNodes.push(newNodeUrl);
        res.json({note: `New node: ${newNodeUrl} registered successfully with node.`})
    }
    

});

app.post('/register-nodes-bulk', (req, res) => {
    const allNetworkNodes = req.body.allNetworkNodes;
    const addedNodes = [];

    allNetworkNodes.forEach( (networkNodeUrl) => {
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = networkNodeUrl !== bitcoin.currentNodeUrl;

        if (nodeNotAlreadyPresent && notCurrentNode) {
            bitcoin.networkNodes.push(networkNodeUrl);
            addedNodes.push(networkNodeUrl);
        }
    });

    res.json( {
        host: bitcoin.currentNodeUrl,
        addedNodes: [...addedNodes]
    })
});

app.listen(port, function () {
    console.log(`listening on port ${port}...`);
});