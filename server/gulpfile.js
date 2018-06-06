var gulp = require('gulp');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var jest = require('gulp-jest').default;
var sourcemaps = require('gulp-sourcemaps');

gulp.task('ts', function () {
	return gulp.src([
		'src/**/*.ts',
		'!src/**/*.test.ts'
	])
		.pipe(sourcemaps.init())
		.pipe(ts.createProject('tsconfig.json')())
		.pipe(sourcemaps.write('.'))
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

gulp.task('jest', function () {
	process.env.NODE_ENV = 'test';

	return gulp.src('src/**/*.test.tsx')
		.pipe(ts.createProject('tsconfig.json')())
		.pipe(gulp.dest('dist'))
		.pipe(jest());
});

gulp.task('jest:full', function () {
	process.env.NODE_ENV = 'test';

	return gulp.src('src/**/*.test.tsx')
		.pipe(ts.createProject('tsconfig.json')())
		.pipe(gulp.dest('dist'))
		.pipe(jest({
			converage: true
		}));
});

gulp.task('default', function () {
	return gulp.watch('src/**/*.ts', gulp.series('ts', 'tslint'));
});