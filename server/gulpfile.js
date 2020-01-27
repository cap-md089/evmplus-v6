var gulp = require('gulp');
var exec = require('gulp-shell');
var { existsSync } = require('fs');

function getDateString() {
	var date = new Date();

	return `${date.getFullYear()}-${('00' + (date.getMonth() + 1)).substr(
		-2
	)}-${('00' + date.getDate()).substr(-2)}-${('00' + date.getHours()).substr(
		-2
	)}-${('00' + date.getMinutes()).substr(-2)}`;
}

if (existsSync('./dist/conf.js')) {
	var conf = require('./dist/conf');

	const conn = conf.default.database.connection;
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
