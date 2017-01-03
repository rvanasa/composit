
var Composit = require('.')(require('./test/config'));

var server = require('./src/server')(Composit).listen(process.env.PORT);

console.log('Server loaded successfully.');