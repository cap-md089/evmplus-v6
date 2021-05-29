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

import { spawn } from 'child_process';
import {
	asyncLeft,
	BasicMySQLRequest,
	Either,
	FileUserAccessControlPermissions,
	Maybe,
	RawFileObject,
	ServerError,
	userHasFilePermission,
} from 'common-lib';
import * as express from 'express';
import {
	AccountBackend,
	accountRequestTransformer,
	CAP,
	combineBackends,
	FileBackend,
	getAccountBackend,
	getCombinedMemberBackend,
	getFileBackend,
	getRegistryBackend,
	MemberBackend,
	MySQLRequest,
	PAM,
	RegistryBackend,
} from 'server-common';

export default async (request: express.Request, res: express.Response): Promise<void> => {
	const req = (request as unknown) as MySQLRequest;

	const backend = combineBackends<
		BasicMySQLRequest,
		[RegistryBackend, AccountBackend, CAP.CAPMemberBackend, MemberBackend, FileBackend]
	>(
		getRegistryBackend,
		getAccountBackend,
		CAP.getCAPMemberBackend,
		getCombinedMemberBackend(),
		getFileBackend,
	)(req);

	const fileEither = await accountRequestTransformer(req)
		.flatMap(PAM.memberRequestTransformer(false))
		.flatMap(r =>
			backend.getRegistry(r.account).flatMap(registry =>
				Maybe.orSome(
					asyncLeft<ServerError, RawFileObject>({
						type: 'OTHER',
						code: 404,
						message: "Favicon doesn't exist",
					}),
				)(
					Maybe.map(backend.getFileObject(r.account)(r.member))(
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
		await backend.downloadFileObject(file)(convertProcess.stdin);
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
