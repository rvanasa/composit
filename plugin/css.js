module.exports = {
	name: 'CSS',
	client(frame, composit)
	{
		var cache = {};
		composit.listen('css', function(file)
		{
			var sheets = frame.document.querySelectorAll('link[href="' + file.path + '"],meta[href="/' + file.path + '"]');
			for(var i = 0; i < sheets.length; i++)
			{
				sheets[i].disabled = true;
			}
			var elem = cache[file.path];
			if(!elem)
			{
				elem = cache[file.path] = frame.document.createElement('style');
				frame.document.head.appendChild(elem);
			}
			elem.textContent = file.data;
		});
	}
};