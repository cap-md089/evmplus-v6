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

import {
	BasicMySQLRequest,
	Either,
	FileUserAccessControlPermissions,
	Maybe,
	MaybeObj,
	RawFileObject,
	SessionType,
	User,
	userHasFilePermission,
} from 'common-lib';
import { accountRequestTransformer, downloadFileObject, getFileObject, PAM } from 'server-common';
import asyncErrorHandler from '../../../lib/asyncErrorHandler';

const canReadFile = userHasFilePermission(FileUserAccessControlPermissions.READ);

export const func = () =>
	asyncErrorHandler(async (req: BasicMySQLRequest<{ fileid: string }>, res) => {
		const fileEither = await accountRequestTransformer(req)
			.flatMap(PAM.memberRequestTransformer(SessionType.REGULAR, false))
			.flatMap(request =>
				getFileObject(true)(req.mysqlx)(request.account)(request.params.fileid).map<
					[RawFileObject, MaybeObj<User>]
				>(f => [f, request.member])
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
			res.status(403);
			res.end();
			await req.mysqlxSession.close();
			return;
		}

		// const fileRequested = createReadStream(
		// 	join(req.configuration.DRIVE_STORAGE_PATH, file.accountID + '-' + file.id)
		// );

		res.contentType(file.contentType);
		res.setHeader('Content-Disposition', 'attachment; filename="' + file.fileName + '"');

		await req.mysqlxSession.close();

		await downloadFileObject(req.configuration)(file)(res);
	});

export default func();
