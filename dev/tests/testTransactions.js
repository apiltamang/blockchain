const Blockchain = require('../blockchain');
const bitcoin = new Blockchain();

bitcoin.createNewBlock(293749, '098ADFADF', 'ADS12345');
bitcoin.createNewTransaction(100, 'AlexAddressABC', 'JenAddressXYZ');
bitcoin.createNewBlock(234810, 'OAJDV654356', '097ACGAD');

bitcoin.createNewTransaction(300, 'JenAddressABC', 'SamAddressXYZ');
bitcoin.createNewTransaction(400, 'JenAddressABC', 'SamAddressXYZ');
bitcoin.createNewTransaction(500, 'JenAddressABC', 'SamAddressXYZ');
bitcoin.createNewBlock(345908, 'YAJXCV123', 'FJXFG29458');


console.log(bitcoin.chain[2]);

