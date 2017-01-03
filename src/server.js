'use strict'

var fs = require('fs-extra');
var glob = require('glob');

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

module.exports = function(composit)
{
	var app = express();
	
	app.set('views', __dirname + '/view');
	app.set('view engine', 'ejs');
	
	app.use(cookieParser());
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.json());
	
	app.get('/', (req, res) => res.render('index', {
		plugins: composit.plugins.filter(plugin => plugin.client).map(plugin =>
		{
			var str = plugin.client.toString();
			if(!str.startsWith('function')) str = 'function ' + str;
			str = '(' + str + ')';
			return Object.assign({}, plugin, {client: str});
		}),
	}));
	app.use(express.static(__dirname + '/www'));
	
	var apiRouter = express.Router();
	app.use('/api', apiRouter);
	
	apiRouter.route('/file')
		.get((req, res) =>
		{
			res.send(glob.sync(composit.path('**/*'), {nodir: true}).map(f => f.substring(composit.path().length)));
		})
		.post((req, res, next) =>
		{
			var file = req.body;
			if(!file.path || !file.data) return res.status(400).send('Must provide file path and data');
			
			fs.mkdirpSync(composit.path(file.path.substring(0, file.path.lastIndexOf('/'))));
			fs.writeFileSync(composit.path(file.path), file.data);
			composit.notify(file);
			res.send('Updated file: ' + req.body.path);
		});
	
	apiRouter.route('/file/*')
		.get((req, res) =>
		{
			var path = req.params[0];
			res.json({
				path,
				data: fs.readFileSync(composit.path(path)).toString(),
			});
		});
	
	var publicRouter = express.Router();
	app.use('/public', publicRouter);
	publicRouter.get('/', (req, res) => res.redirect('/public/index.html'));
	publicRouter.use(express.static(composit.path()));
	
	composit.init('server', publicRouter);
	
	return app;
}