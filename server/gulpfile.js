var gulp = require('gulp');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');

gulp.task('ts', function () {
	return gulp.src([
		'src/**/*.ts',
		'!src/**/*.test.ts'
	])
		.pipe(ts.createProject('tsconfig.json')())
		.pipe(gulp.dest('dist'))
});

gulp.task('tslint', function () {
	return gulp.src([
		'src/**/*.ts',
		'!src/**/*.test.ts'
	])
		.pipe(tslint({
			
		}))
		.pipe(tslint.report());
});

gulp.task('default', function () {
	return gulp.watch('src/**/*.ts', ['ts', 'tslint']);
});