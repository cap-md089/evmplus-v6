/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	BasicMySQLRequest,
	Either,
	FileUserAccessControlPermissions,
	Maybe,
	MaybeObj,
	RawFileObject,
	User,
	userHasFilePermission,
} from 'common-lib';
import { accountRequestTransformer, getCombinedFileBackend, PAM } from 'server-common';
import asyncErrorHandler from '../../../lib/asyncErrorHandler';

const canReadFile = userHasFilePermission(FileUserAccessControlPermissions.READ);

export const func = (backendGenerator = getCombinedFileBackend) =>
	asyncErrorHandler(async (req: BasicMySQLRequest<{ fileid: string }>, res) => {
		const backend = backendGenerator()(req);

		const fileEither = await accountRequestTransformer(req)
			.flatMap(PAM.memberRequestTransformer(false))
			.flatMap(request =>
				backend
					.getFileObject(request.account)(request.member)(request.params.fileid)
					.map<[RawFileObject, MaybeObj<User>]>(f => [f, request.member]),
			)
			.join();

		if (Either.isLeft(fileEither)) {
			res.status(fileEither.value.code);
			res.end();

			if (fileEither.value.type === 'CRASH') {
				throw fileEither.value.error;
			}

			await req.mysqlxSession.close();

			return;
		}

		const [file, member] = fileEither.value;

		if (!canReadFile(Maybe.orSome<null | User>(null)(member))(file)) {
			if (Maybe.isNone(member)) {
				res.redirect('/signin?returnurl=' + req.originalUrl);
			} else {
				res.status(403);
				res.end();
			}
			await req.mysqlxSession.close();
			return;
		}

		await req.mysqlxSession.close();

		await backend.downloadFileObject(file)(res);
	});

export default func();
