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

import * as Busboy from 'busboy';
import {
	Either,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	FullFileObject,
	Maybe,
	MemberReference,
	RawFileObject,
	SessionType,
	stringifyMemberReference,
	toReference,
	userHasFilePermission,
} from 'common-lib';
import * as debug from 'debug';
import {
	accountRequestTransformer,
	getFileObject,
	getFilePath,
	MySQLRequest,
	PAM,
	uploadFile,
} from 'server-common';
import { v4 as uuid } from 'uuid';
import asyncErrorHandler from '../../../lib/asyncErrorHandler';
import saveServerError from '../../../lib/saveServerError';

export const isImage = (ending: string): boolean =>
	['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ending);

const canSaveToFolder = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

const logFunc = debug('server:api:files:files:fileupload');

/*
	File data plan:

	1. Store FILE on disk
	2. Filename will be a UUID (there already happens to be a UUID library for tokens...)
	3. MySQL database will store METADATA (Author, filename, etc)
*/
export const func = () =>
	asyncErrorHandler(async (req: MySQLRequest<{ parentid?: string }>, res) => {
		const getParentID = (mem: MemberReference) =>
			req.params.parentid ?? stringifyMemberReference(mem);

		const reqEither = await accountRequestTransformer(req)
			.flatMap(PAM.memberRequestTransformer(true))
			.filter(request => request.session.type === SessionType.REGULAR, {
				type: 'OTHER',
				code: 403,
				message:
					'Member cannot perform the requested action with their current session. Try signing out and back in',
			})
			.flatMap(request =>
				getFileObject(req.mysqlx)(request.account)(Maybe.some(request.member))(
					getParentID(request.member),
				).flatMap(file =>
					getFilePath(req.mysqlx)(Maybe.some(request.member))(file).map(
						filePath => [request.member, request.account, file, filePath] as const,
					),
				),
			)
			.join();

		if (Either.isLeft(reqEither)) {
			res.status(reqEither.value.code);
			res.end();

			await req.mysqlxSession.close();

			if (reqEither.value.type === 'CRASH') {
				throw reqEither.value.error;
			}

			return;
		}

		const [member, account, parent, parentPath] = reqEither.value;

		const parentID = getParentID(member);

		if (
			typeof req.headers.token !== 'string' ||
			!(await PAM.isTokenValid(req.mysqlx, member, req.headers.token))
		) {
			res.status(401);
			res.end();
			return;
		}

		if (!canSaveToFolder(member)(parent)) {
			res.status(403);
			res.end();
			return;
		}

		const created = Date.now();

		const filesCollection = req.mysqlx.getCollection<RawFileObject>('Files');
		const owner = toReference(member);

		const busboy = new Busboy({
			headers: req.headers,
		});

		req.pipe(busboy);

		let sentFile = false;

		logFunc('Handling file uploads');

		await new Promise<void>(resolve => {
			const promises: Array<Promise<void>> = [];

			busboy.on('file', (fieldName, file, fileName, encoding, contentType) => {
				logFunc('new file incoming', fileName);
				const id = uuid().replace(/-/g, '');

				let shouldWriteComma = true;
				if (!sentFile) {
					res.status(200);
					res.write('[');
					shouldWriteComma = false;
				}

				sentFile = true;

				const uploadedFile: RawFileObject = {
					kind: 'drive#file',
					id,
					accountID: account.id,
					comments: '',
					contentType,
					created,
					fileName,
					forDisplay: false,
					forSlideshow: false,
					permissions: [
						{
							type: FileUserAccessControlType.USER,
							permission: FileUserAccessControlPermissions.READ,
							reference: toReference(member),
						},
					],
					owner,
					parentID,
				};

				promises.push(
					Promise.all([
						uploadFile(req.configuration)(uploadedFile)(file),
						filesCollection.add(uploadedFile).execute(),
					])
						.then(async () => {
							const fullFileObject: FullFileObject = {
								...uploadedFile,
								folderPath: [
									...parentPath,
									{
										id,
										name: fileName,
									},
								],
								uploader: Maybe.some(member),
							};

							logFunc('added file, writing metadata', fileName);

							res.write(
								(shouldWriteComma ? ', ' : '') + JSON.stringify(fullFileObject),
							);
						})
						.catch(err => {
							logFunc('encountered error', err);
							saveServerError(err, req);
							res.status(500);
							res.end();
						}),
				);
			});

			busboy.on('finish', () => {
				Promise.all(promises)
					.then(() => {
						logFunc('ended file upload');
						if (!sentFile) {
							res.status(400);
							res.end();
						} else {
							res.write(']');
							res.end();
						}
					})
					.then(() => req.mysqlxSession.close())
					.then(() => {
						logFunc('closed mysql session');
						resolve();
					});
			});
		});
	});

export default func();
