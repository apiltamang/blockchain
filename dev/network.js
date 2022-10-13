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
    const newTransaction = req.body;
    console.log("got body: ", JSON.stringify(req.body));
    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
    res.json( {note: `Transaction ${newTransaction.transactionId} will be added to block ${blockIndex} in node: ${bitcoin.currentNodeUrl}`})
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

    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock: newBlock },
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises).then(data => {
        const requestOptions = {
            uri: bitcoin.currentNodeUrl + "/transaction/broadcast",
            method: 'POST',
            body: {
                amount: 12.5,
                sender: '00',
                recipient: nodeAddress
            },
            json: true
        };
        console.log( { note: "Created new block and broadcast to network nodes"} );
        console.log("now broadcasting reward transaction");
        return rp(requestOptions)
    }).then(data => {
        res.json({
            note: 'New block mined successfully and reward sent',
            block: newBlock
        })
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

    const msg = [];
    if (nodeNotAlreadyPresent && notCurrentNode) {
        bitcoin.networkNodes.push(newNodeUrl);
        msg.push(`New node: ${newNodeUrl} registered successfully with node.`);

        const reverseRegister = {
            uri: newNodeUrl + "/register-node",
            method: 'POST',
            body: {
                newNodeUrl: bitcoin.currentNodeUrl
            },
            json: true
        };

        rp(reverseRegister).then(data => {
            msg.push(data);
            res.json(data)
        })
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

app.post('/transaction/broadcast', function (req, res) {
   const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
   bitcoin.addTransactionToPendingTransactions(newTransaction);
   console.log("sending obj: ", JSON.stringify(newTransaction));

   const requestPromises = [];
   bitcoin.networkNodes.forEach(networkNodeUrl => {
       const requestOptions = {
           uri: networkNodeUrl + "/transaction",
           method: 'POST',
           body: newTransaction,
           json: true
       };
       requestPromises.push(rp(requestOptions));
   });

   Promise.all(requestPromises).then(data => {
       res.json( {note: 'Transaction created and broadcast to network nodes successfully!'} )
   })
});

app.post('/receive-new-block', function (req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    if (correctHash && correctIndex) {
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];
        res.json({
            note: `${nodeAddress} received and accepted new block with hash: ${newBlock.hash}`,
            newBlock: newBlock
        });
    } else {
        res.json({
            note: `New block with hash: ${newBlock.hash} rejected by node: ${nodeAddress}`
        });
    }
});

app.listen(port, function () {
    console.log(`listening on port ${port}...`);
});