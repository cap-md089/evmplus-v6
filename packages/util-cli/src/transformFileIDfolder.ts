#!/usr/bin/env node
/**
 * Copyright (C) 2020 Glenn Rioux
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

import * as mysql from '@mysql/xdevapi';
import { getSession } from '@mysql/xdevapi';
import { Either, Maybe } from 'common-lib';
import { conf } from 'server-common';
import { backendGenerator } from './lib/backend';

export const collectLegacySqlResults = async <T>(
	find: mysql.SqlExecute,
): Promise<Array<mysql.WithoutEmpty<T>>> => {
	try {
		return (await find.execute()).fetchAll() as Array<mysql.WithoutEmpty<T>>;
	} catch (e) {
		console.error(e);
		throw new Error(e);
	}
};

process.on('unhandledRejection', up => {
	throw up;
});

void (async () => {
	const config = await conf.getCLIConfiguration();

	const session = await getSession({
		host: config.DB_HOST,
		password: config.DB_PASSWORD,
		port: config.DB_PORT,
		user: config.DB_USER,
	});

	const FIDs = await collectLegacySqlResults<[FileID: string]>(
		session.sql(
			'SELECT FileID FROM EventManagement.FileEventAssignments WHERE EID > 555 GROUP BY FileID;',
		),
	);

	const schema = session.getSchema(config.DB_SCHEMA);

	const backend = backendGenerator(config)(schema);

	const account = await backend.getAccount('md089').fullJoin();

	for (const fid of FIDs) {
		const [FileID] = fid;
		console.log('FID: ', FileID);
		const activeFile = await backend.getFileObject(account)(Maybe.none())(FileID);

		if (Either.isRight(activeFile)) {
			activeFile.value.parentID = 'Events';
			await backend.saveFileObject(activeFile.value).fullJoin();
		} else {
			console.log('failed');
		}
	}

	await session.close();

	process.exit();
})();
