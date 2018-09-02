var gulp = require('gulp');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var jest = require('gulp-jest').default;
var sourcemaps = require('gulp-sourcemaps');
var exec = require('gulp-shell');

var conf = require('./dist/conf');

function getDateString() {
	var date = new Date();

	return `${date.getFullYear()}-${('00' + (date.getMonth() + 1)).substr(
		-2
	)}-${('00' + date.getDate()).substr(-2)}-${('00' + date.getHours()).substr(
		-2
	)}-${('00' + date.getMinutes()).substr(-2)}`;
}

gulp.task('ts', function() {
	return gulp
		.src(['src/**/*.ts', '!src/**/*.test.ts', '../lib/index.d.ts'])
		.pipe(sourcemaps.init())
		.pipe(ts.createProject('tsconfig.json')())
		.pipe(
			sourcemaps.write('./', {
				sourceRoot: './src',
				includeContent: false
			})
		)
		.pipe(gulp.dest('dist'));
});

gulp.task('tslint', function() {
	return gulp
		.src(['src/**/*.ts', '!src/**/*.test.ts'])
		.pipe(tslint({}))
		.pipe(
			tslint.report({
				emitError: false,
				summarizeFailureOutput: true
			})
		);
});

gulp.task('jest', function() {
	process.env.NODE_ENV = 'test';

	return gulp
		.src('src/**/*.test.ts')
		.pipe(ts.createProject('tsconfig.json')())
		.pipe(gulp.dest('dist'))
		.pipe(jest());
});

gulp.task('jest:full', function() {
	process.env.NODE_ENV = 'test';

	return gulp
		.src('src/**/*.test.ts')
		.pipe(ts.createProject('tsconfig.json')())
		.pipe(gulp.dest('dist'))
		.pipe(
			jest({
				converage: true
			})
		);
});

const conn = conf.Configuration.database.connection;
gulp.task(
	'mysql:backup',
	exec.task(
		`mysqldump --user=${conn.user} --password=${
			conn.password
		} --add-drop-database --result-file=./mysqldumps/current.sql --routines --triggers --databases ${
			conn.database
		} && cp mysqldumps/current.sql ./mysqldumps/${getDateString()}.sql`
	)
);

gulp.task(
	'mysql:import',
	exec.task(
		`mysql --user=${conn.user} --password=${
			conn.password
		} < mysqldumps/current.sql`
	)
);

gulp.task('watch', function() {
	return gulp.watch(
		['src/**/*.ts', '../lib/index.d.ts'],
		gulp.series('ts', 'tslint')
	);
});

gulp.task('default', function() {
	return gulp.watch(
		['src/**/*.ts', '../lib/index.d.ts'],
		gulp.series('ts', 'tslint')
	);
});
