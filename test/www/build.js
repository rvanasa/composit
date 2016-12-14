var gulp = require('gulp');

var rename = require('gulp-rename');
var babel = require('gulp-babel');
var ngmin = require('gulp-ngmin');
var sass = require('gulp-sass');
var ejs = require('gulp-ejs');

module.exports = function(register)
{
	register('app', {
		concat: 'app.min.js',
		compose: (stream) => stream.pipe(babel()).pipe(ngmin())
	});
	
	register('style', {
		concat: 'app.css',
		build(src, dest)
		{
			return gulp.src(src + '/style/app.scss')
				.pipe(sass().on('error', sass.logError))
				.pipe(rename('app.css'))
				.pipe(gulp.dest(dest));
		},
	});
	
	register('index', {
		build(src, dest)
		{
			return gulp.src(src + '/index/index.ejs')
				.pipe(ejs())
				.pipe(rename('index.html'))
				.pipe(gulp.dest(dest));
		},
	});
	
	register('img', {
		compose: (stream) => stream,
	});
}