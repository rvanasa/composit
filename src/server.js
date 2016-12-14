
var path = require('path');

var express = require('express');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

module.exports = function(directory)
{
	var app = express();
	
	app.use(cookieParser());
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.json());
	
	app.get('/', (req, res) => res.redirect('/index.html'));
    app.use(express.static(path.resolve(directory)));
	
	return app;
}