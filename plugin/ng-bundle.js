var ngmin = require('ngmin');
var babel = require('babel-core');
var UglifyJS = require('uglify-js');

function camelCase(name)
{
	return name.toLowerCase().replace(/[^a-z]+[a-z]/g, (match) => match.charAt(match.length - 1).toUpperCase());
}

function pascalCase(name)
{
	return name.toLowerCase().replace(/^[a-z]|[^a-z]+[a-z]/g, (match) => match.charAt(match.length - 1).toUpperCase());
}

function buildFile(composit)
{
	var files = composit.loadAll('**/*.js');
	
	function register(type, nameProvider)
	{
		return files
			.filter(entry => entry.path.endsWith(`.${type}.js`))
			.map(entry =>
			{
				var js = entry.data;
				var name = nameProvider(entry.path.substring(entry.path.lastIndexOf('/') + 1, entry.path.length - `.${type}.js`.length));
				return `.${type}(${JSON.stringify(name)}, ${js})`;
			})
			.join('\n');
	}
	
	function registerComponent(type, nameProvider)
	{
		return files
			.filter(entry => entry.path.endsWith(`.${type}.js`))
			.map(entry =>
			{
				var js = entry.data;
				var html = composit.load(entry.path.replace(`${type}.js`, 'html'));
				if(html) html = html.data;
				
				var name = nameProvider(entry.path.substring(entry.path.lastIndexOf('/') + 1, entry.path.length - `.${type}.js`.length));
				return `.${type}(${JSON.stringify(name)}, ${js.replace('$HTML', JSON.stringify(html))})`;
			})
			.join('\n');
	}
	
	var list = [];
	list.push(`${composit.load('main.js').data}`);
	list.push(`angular.element(function() {angular.bootstrap(document, ['app'])});`);
	list.push(`angular.module('app', $config.require)`);
	
	list.push(register('provider', pascalCase));
	list.push(register('constant', pascalCase));
	list.push(register('value', pascalCase));
	list.push(register('service', n => pascalCase(n) + 'Service'));
	list.push(register('factory', n => pascalCase(n) + 'Factory'));
	list.push(registerComponent('directive', camelCase));
	list.push(registerComponent('component', camelCase));
	
	return list.map(s => s.trim()).join('\n');
}

module.exports = {
	name: 'Angular 1.x',
	client(frame, composit)
	{
		function getName(entry, ext)
		{
			var start = entry.path.lastIndexOf('/') + 1;
			var end = ext ? entry.path.length - ext.length : entry.path.indexOf('.', start);
			return entry.path.substring(start, end);
		}
		
		setTimeout(() =>
		{
			var angular = frame.angular;
			
			var injector = angular.element(frame.document).injector();
			
			composit.listen('component.js', reloadComponent((entry, directive) =>
			{
				// var newCtrl = frame.eval(entry.data).controller;
				
				// angular.element(getName(entry)).each((i, elem) =>
				// {
				// 	var scope = angular.element(elem).isolateScope();
				// 	injector.invoke(newCtrl);
				// });
			}));
			
			composit.listen('html', reloadComponent((entry, directive) =>
			{
				// directive.template = entry.data;
				
				angular.element(getName(entry)).each((i, elem) =>
				{
					try
					{
						var scope = angular.element(elem).isolateScope();
						scope.$apply(() =>
						{
							angular.element(elem).html(injector.get('$compile')(entry.data)(scope));
						});
					}
					catch(e)
					{
						console.error('Failed to dynamically update ' + entry.name, e);
					}
				});
			}));
			
			function reloadComponent(patch)
			{
				return function(entry)
				{
					var name = getName(entry);
					name = name.toLowerCase().replace(/[^a-z]+[a-z]/g, (match) => match.charAt(match.length - 1).toUpperCase());
					
					var directive = injector.get(name + 'Directive')[0];
					if(directive)
					{
						patch(entry, directive);
						injector.get('$rootScope').$apply();
					}
				}
			}
		}, 1000);
	},
	server(router, composit)
	{
		router.get('/bundle.js', (req, res) => res.send(buildFile(composit)));
	},
	build(builder, composit)
	{
		console.log('Bundling AngularJS files...');
		
		var text = buildFile(composit);
		text = babel.transform(text, {presets: ['es2015']}).code;
		text = ngmin.annotate(text);
		text = UglifyJS.minify(text, {fromString: true}).code;
		
		builder.ignoreAll(entry => entry.path.endsWith('.html') && composit.has(entry.path.replace(/html$/, 'component.js')));
		builder.ignoreAll('js');
		
		builder.build({
			path: 'bundle.js',
			data: text,
		});
	}
};