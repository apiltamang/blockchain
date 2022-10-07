const Blockchain = require('../blockchain');
const bitcoin = new Blockchain();

bitcoin.createNewBlock(293749, '098ADFADF', 'ADSF@#$#');
bitcoin.createNewBlock(83452, 'ADF@#$AF', 'ADFA3454');
bitcoin.createNewBlock(83452, 'SFGSGF3243', 'CBDFGdf@#$');

console.log(bitcoin);