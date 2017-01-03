var glob = require('glob');
var babel = require('babel-core');
var UglifyJS = require('uglify-js');

module.exports = {
	name: 'JavaScript Bundle',
	server(router, composit)
	{
		router.get('bundle.js', (req, res) =>
		{
			res.send(glob.sync(composit.path('**/*.js'), {nodir: true})
				.map(f => composit.find(f))
				.join('\n'));
		});
	},
	build(builder, composit)
	{
		console.log('Bundling js files...')
		
		var text = glob.sync(composit.path('**/*.js'), {nodir: true})
			.map(path => babel.transformFileSync(path, {presets: ['es2015']}).code)
			.join('\n');
		
		builder.ignore('js');
		
		builder.build({
			path: 'bundle.js',
			data: UglifyJS.minify(text, {fromString: true}).code,
		});
	}
};