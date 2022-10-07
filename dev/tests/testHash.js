const Blockchain = require('../blockchain');
const bitcoin = new Blockchain();

const prevHash = 'ADFA43255';
const currData =
    [
        {   amount: 300,
            sender: 'JenAddressABC',
            recipient: 'SamAddressXYZ' },
        {   amount: 400,
            sender: 'JenAddressABc',
            recipient: 'SamAddressXYZ' },
        {   amount: 500.1,
            sender: 'JenAddressABC',
            recipient: 'SamAddressXYZ' }
    ];

console.log(bitcoin.hashBlock(prevHash, currData, 101));