
require('./index')({
	src: __dirname + '/src',
	dest: __dirname + '/dist'
});

var app = require('./test/server')(__dirname + '/dist');
app.listen(process.env.PORT || 80, process.env.IP);

console.log('Started server.');