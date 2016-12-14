
var gulp = require('gulp');
var del = require('del');

var concat = require('gulp-concat');

module.exports = function(config)
{
	var inputPath = config.src;
	var buildPath = config.dest;
	
	var composers = {};
	function register(id, config)
	{
		composers[id] = config;
		gulp.task('module-' + id, ['clean'], config.build ? () => config.build(inputPath, buildPath) : () =>
		{
			var stream = gulp.src(inputPath + '/' + id + '/**/*');
			if(config.compose) config.compose(stream);
			if(config.concat) stream = stream.pipe(concat(config.concat));
			return stream.pipe(gulp.dest(buildPath + '/' + id));
		});
	}
	
	require(inputPath + '/build')(register);
	
	gulp.task('clean', () => del(buildPath));
	
	gulp.task('watch', () =>
	{
		gulp.watch('./project/**/*', ['modules']);
	});
	
	gulp.task('modules', Object.keys(composers).map((id) => 'module-' + id))
	
	gulp.task('default', ['modules', 'watch']);
	
	gulp.start('default');
}