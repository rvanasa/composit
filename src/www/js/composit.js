(function()
{
	/// TEMP BROWSER VERSION ///
	
	var Composit = {
		plugins: [],
		notifiers: [],
		path: function(uri)
		{
			return uri || '';
		},
		use: function(plugin)
		{
			if(Array.isArray(plugin))
			{
				var list = plugin;
				for(var i = 0; i < list.length; i++)
				{
					this.use(list[i]);
				}
			}
			else
			{
				this.plugins.push(plugin);
			}
		},
		init: function(env, context)
		{
			for(var i = 0; i < this.plugins.length; i++)
			{
				try
				{
					var w = window;
					var provider = this.plugins[i][env];
					if(provider) w.eval(provider).call(this, context, this);
				}
				catch(e)
				{
					console.error('Failed to initialize module:', this.plugins[i], e);
					throw e;
				}
			}
		},
		notify: function(entry)
		{
			for(var i = 0; i < this.notifiers.length; i++)
			{
				this.notifiers[i](entry);
			}
		},
		listen: function(ext, callback)
		{
			if(ext && ext !== '*')
			{
				var cb = callback;
				callback = function(entry)
				{
					if(entry.path.endsWith('.' + ext)) return cb.apply(this, arguments);
				}
			}
			this.notifiers.push(callback);
		},
	};
	
	window.Composit = Composit;
}());