var fs = require('fs');
var path = require('path');

var ejs = require('ejs');

module.exports = {
	name: 'EJS',
	server(router, composit)
	{
		router.get('/index.html', (req, res, next) =>
		{
			var data = {
				composit: {
					style(uri)
					{
						return `<link rel="stylesheet" href="${uri}">`;
					},
					script(uri)
					{
						return `<script src="${uri}"></script>`;
					},
				},
			};
			
			ejs.renderFile(composit.path('index.ejs'), data, (err, html) =>
			{
				if(err) return next(err);
				res.send(html);
			});
		});
	},
	build(builder, composit)
	{
		// var data = {
		// 	composit: {
		// 		style(uri)
		// 		{
		// 			return `<style>${fs.readFileSync(path.join(composit.config.dest, uri)).data}</style>`;
		// 		},
		// 		script(uri)
		// 		{
		// 			return `<script>${fs.readFileSync(path.join(composit.config.dest, uri)).data}</script>`;
		// 		},
		// 	},
		// };
		
		var data = {
			composit: {
				style(uri)
				{
					return `<link rel="stylesheet" href="${uri}">`;
				},
				script(uri)
				{
					return `<script src="${uri}"></script>`;
				},
			},
		};
		
		builder.ignoreAll('ejs');
		
		ejs.renderFile(composit.path('index.ejs'), data, (err, html) =>
		{
			if(err) return builder.fail(err);
			builder.build({
				path: 'index.html',
				data: html,
			});
		});
	}
};