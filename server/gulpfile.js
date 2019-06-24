var gulp = require('gulp');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var jest = require('gulp-jest').default;
var sourcemaps = require('gulp-sourcemaps');
var exec = require('gulp-shell');
var { existsSync } = require('fs');

var typescriptFiles = [
	'src/**/*.ts',
	'!src/__tests__/**/*.ts',
	'../lib/*.d.ts'
];

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
		.src(typescriptFiles, { base: './src' })
		.pipe(sourcemaps.init())
		.pipe(ts.createProject('tsconfig.json')())
		.pipe(sourcemaps.mapSources(sourcePath => sourcePath.slice(16)))
		.pipe(sourcemaps.write('../maps', {
			includeContent: false,
			sourceRoot: file => '../src'
		}))
		.pipe(gulp.dest('./dist'));
});

gulp.task('tslint', function() {
	return gulp
		.src(typescriptFiles)
		.pipe(tslint({}))
		.pipe(
			tslint.report({
				emitError: false,
				summarizeFailureOutput: true
			})
		);
});

if (existsSync('./dist/conf.js')) {
	var conf = require('./dist/conf');

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
		'mysql:import:127.0.0.1',
		exec.task(
			`mysql --user=${conn.user} --host=127.0.0.1 --password=${
				conn.password
			} < mysqldumps/current.sql`
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
}

gulp.task('watch', function() {
	return gulp.watch(
		typescriptFiles,
		gulp.parallel('ts', 'tslint')
	);
});

gulp.task('default', function() {
	return gulp.watch(
		typescriptFiles,
		gulp.parallel('ts', 'tslint')
	);
});
