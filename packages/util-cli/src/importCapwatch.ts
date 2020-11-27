#!/usr/bin/env node
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
import 'dotenv/config';
import { getConf, ImportCAPWATCHFile } from 'server-common';

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

(async () => {
	const conf = await getConf();

	const session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER,
	});

	// @ts-ignore
	const schema = session.getSchema(conf.DB_SCHEMA);

	const capImport = ImportCAPWATCHFile(capwatchPath, schema, session);

	for await (const i of capImport) {
		console.log(i);
	}

	process.exit();
})();
