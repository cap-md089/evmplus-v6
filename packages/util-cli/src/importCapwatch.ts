#!/usr/local/bin/node --no-warnings
/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { getSession } from '@mysql/xdevapi';
import { conf, ImportCAPWATCHFile } from 'server-common';

console.log(process.argv);

if (process.argv.length !== 3) {
	console.error('Error! CAPWATCH file not provided');
	process.exit(2);
}

const capwatchPath = process.argv[2];

if (!capwatchPath.startsWith('/')) {
	console.error('Error! CAPWATCH file path must be absolute');
	process.exit(3);
}

process.on('unhandledRejection', up => {
	throw up;
});

void (async () => {
	const cliConf = await conf.getCLIConfiguration();

	const session = await getSession({
		host: cliConf.DB_HOST,
		password: cliConf.DB_PASSWORD,
		port: cliConf.DB_PORT,
		user: cliConf.DB_USER,
	});

	const schema = session.getSchema(cliConf.DB_SCHEMA);

	const capImport = ImportCAPWATCHFile(capwatchPath, schema, session);

	for await (const i of capImport) {
		switch (i.type) {
			case 'Update':
				process.stdout.write('.');
				break;
			case 'Log':
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				process.stdout.write(i.currentRecord.toString());
				process.stdout.write(',');
				break;
			default:
				console.log(i);
		}
		// console.log(i);
	}

	process.exit();
})();
