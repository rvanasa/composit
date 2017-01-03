'use strict'

var path = require('path');
var fs = require('fs-extra');

module.exports = function(composit)
{
	var src = composit.path();
	var dest = composit.config.dest;
	
	if(!dest) throw new Error('Config property `dest` not found');
	if(src === dest) throw new Error('Project cannot be built into the `src` directory');
	
	var builder = {
		building: true,
		entries: composit.loadAll(),
		env: 'build',
		ignoreAll(condition)
		{
			for(var i = 0; i < this.entries.length; i++)
			{
				var entry = this.entries[i];
				if(typeof condition === 'function' ? condition(entry) : entry.path.endsWith('.' + condition))
				{
					console.log('-', entry.path);
					this.entries.splice(i--, 1);
				}
			}
		},
		build(entry)
		{
			if(this.building)
			{
				var dir = path.join(dest, entry.path.substring(0, entry.path.lastIndexOf('/')));
				fs.mkdirp(dir, (err) =>
				{
					if(err) return console.error('Failed to prepare directory:', dir, err);
					fs.writeFile(path.join(dest, entry.path), entry.data, (err) =>
					{
						if(err) return console.error('Failed to write entry:', entry.path, err);
						console.log('+', entry.path);
					});
				});
			}
		},
		fail()
		{
			this.building = false;
			console.error.apply(console, ['Build sequence failed!'].concat([].slice.call(arguments)));
		},
	};
	
	console.log('Building project:', '`' + src + '` -> `' + dest + '`');
	
	fs.emptyDirSync(dest);
	
	composit.init('build', builder);
	
	for(var entry of builder.entries)
	{
		builder.build(entry);
		// composit.notify(entry);
	}
}