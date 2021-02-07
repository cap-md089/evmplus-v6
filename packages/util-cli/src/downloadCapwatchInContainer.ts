/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org. It uses configuration provided by
 * Docker; specifically, the ORGID to download, the CAPID of the person
 * with permission to perform downloads, and the password of the person
 * performing downloads. The first two are provided by files on the root,
 * the last by a Docker secret
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

import { CAP } from 'server-common';
import { promisify } from 'util';
import { readFile } from 'fs';

const readfile = promisify(readFile);

(async () => {
	const toUtf8 = (buf: Buffer) => buf.toString('utf-8');

	const [nhqPassword, capwatchCAPIDStr, capwatchORGIDStr] = await Promise.all([
		readfile('/run/secrets/capwatch_password').then(toUtf8),
		readfile('/run/secrets/capwatch_capid').then(toUtf8),
		readfile('/run/secrets/capwatch_orgid').then(toUtf8),
	]);

	const capwatchCAPID = parseInt(capwatchCAPIDStr, 10);
	const capwatchORGID = parseInt(capwatchORGIDStr, 10);

	if (isNaN(capwatchCAPID) || capwatchCAPID < 100_000 || capwatchCAPID > 999_999) {
		throw new Error('CAPID for downloading CAPWATCH files must be a six digit integer');
	}

	if (isNaN(capwatchORGID)) {
		throw new Error('ORGID for downloading CAPWATCH files must be a number');
	}

	await CAP.downloadCAPWATCHFile(
		capwatchORGID,
		capwatchCAPID,
		nhqPassword,
		process.env.DOWNLOAD_PATH || '/tmp',
	).fullJoin();
})().then(
	() => {
		console.log('Finished execution');
		process.exit(0);
	},
	e => {
		console.error(e);
		process.exit(1);
	},
);
