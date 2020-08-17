/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { spawn } from 'child_process';
import {
	asyncLeft,
	Either,
	FileUserAccessControlPermissions,
	Maybe,
	RawFileObject,
	ServerError,
	SessionType,
	userHasFilePermission,
} from 'common-lib';
import * as express from 'express';
import {
	accountRequestTransformer,
	downloadFileObject,
	getFileObject,
	getRegistry,
	MySQLRequest,
} from 'server-common';
import { memberRequestTransformer } from 'server-common/dist/member/pam';

export default async (request: express.Request, res: express.Response) => {
	const req = (request as unknown) as MySQLRequest;
	const fileEither = await accountRequestTransformer(req)
		.flatMap(
			memberRequestTransformer(
				// tslint:disable-next-line:no-bitwise
				SessionType.PASSWORD_RESET | SessionType.REGULAR | SessionType.SCAN_ADD,
				false,
			),
		)
		.flatMap(r =>
			getRegistry(r.mysqlx)(r.account).flatMap(registry =>
				Maybe.orSome(
					asyncLeft<ServerError, RawFileObject>({
						type: 'OTHER',
						code: 404,
						message: "Favicon doesn't exist",
					}),
				)(
					Maybe.map(getFileObject(false)(r.mysqlx)(r.account))(
						registry.Website.FaviconID,
					),
				).filter(
					userHasFilePermission(FileUserAccessControlPermissions.READ)(
						r.member.hasValue ? r.member.value : null,
					),
					{
						type: 'OTHER',
						code: 403,
						message: "Member doesn't have permission to view this file",
					},
				),
			),
		)
		.join();

	if (Either.isLeft(fileEither)) {
		res.status(404);
		res.end();

		if (fileEither.value.type === 'CRASH') {
			throw fileEither.value.error;
		}

		await req.mysqlxSession.close();

		return;
	}

	const file = fileEither.value;

	const convertProcess = spawn('convert', ['-', '-resize', '64x64', 'ico:-']);

	try {
		await downloadFileObject(req.configuration)(file)(convertProcess.stdin);
		await req.mysqlxSession.close();
	} catch (e) {
		res.status(500);
		console.error(e);
		return;
	}

	res.status(200);

	// stdout.pipe uses autoClose, handling closing the response for us
	convertProcess.stdout.pipe(res);
	convertProcess.stderr.pipe(process.stderr);
};
