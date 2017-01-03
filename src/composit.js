'use strict'

var path = require('path');
var fs = require('fs');
var glob = require('glob');

module.exports = function(config)
{
	config.src = path.resolve(config.src);
	config.dest = path.resolve(config.dest);
	
	var Composit = {
		config,
		loaded: false,
		plugins: [],
		notifiers: [],
		path(uri)
		{
			if(!uri) return config.src;
			return path.join(config.src, uri);
		},
		relative(fullPath)
		{
			return path.relative(this.path(), fullPath);
		},
		use(plugin)
		{
			if(Array.isArray(plugin))
			{
				var list = plugin;
				for(var i = 0; i < list.length; i++)
				{
					this.use(list[i]);
				}
			}
			if(typeof plugin === 'string')
			{
				var id = plugin;
				this.use(require(path.join('../plugin', id)));
			}
			else
			{
				this.plugins.push(plugin);
			}
		},
		init(env, context)
		{
			for(var i = 0; i < this.plugins.length; i++)
			{
				var provider = this.plugins[i][env];
				if(provider) provider.call(this, context, this);
			}
		},
		has(path)
		{
			return fs.existsSync(this.path(path));
		},
		load(path)
		{
			return {
				path,
				data: fs.readFileSync(this.path(path)).toString(),
			};
		},
		loadAll(pattern)
		{
			if(!pattern) pattern = '**/*';
			
			return glob.sync(this.path(pattern), {nodir: true})
				.map(f => this.load(this.relative(f)));
		},
		notify(entry)
		{
			for(var i = 0; i < this.notifiers.length; i++)
			{
				this.notifiers[i](entry);
			}
		},
		listen(ext, callback)
		{
			if(ext && ext !== '*')
			{
				var cb = callback;
				callback = function(path)
				{
					if(path.endsWith('.' + ext)) return cb.apply(this, arguments);
				}
			}
			this.notifiers.push(callback);
		},
	};
	
	if(config.plugins) Composit.use(config.plugins);
	
	return Composit;
}