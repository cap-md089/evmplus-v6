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
	combineBackends,
	FileBackend,
	getCombinedFileBackend,
	getCombinedPAMBackend,
	MySQLRequest,
	PAM,
} from 'server-common';
import { v4 as uuid } from 'uuid';
import asyncErrorHandler from '../../../lib/asyncErrorHandler';
import saveServerError from '../../../lib/saveServerError';

export const isImage = (ending: string): boolean =>
	['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ending);

const canSaveToFolder = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

const logFunc = debug('server:api:files:files:fileupload');

const pamFileBackend = combineBackends<MySQLRequest, [PAM.PAMBackend, FileBackend]>(
	getCombinedPAMBackend(),
	getCombinedFileBackend(),
);

/*
	File data plan:

	1. Store FILE on disk
	2. Filename will be a UUID (there already happens to be a UUID library for tokens...)
	3. MySQL database will store METADATA (Author, filename, etc)
*/
export const func = (backendGenerator = pamFileBackend) =>
	asyncErrorHandler(async (req: MySQLRequest<{ parentid?: string }>, res) => {
		const getParentID = (mem: MemberReference) =>
			req.params.parentid ?? stringifyMemberReference(mem);

		const backend = backendGenerator(req);

		const reqEither = await accountRequestTransformer(req)
			.flatMap(PAM.memberRequestTransformer(true))
			.filter(request => request.session.type === SessionType.REGULAR, {
				type: 'OTHER',
				code: 403,
				message:
					'Member cannot perform the requested action with their current session. Try signing out and back in',
			})
			.flatMap(request =>
				backend
					.getFileObject(request.account)(Maybe.some(request.member))(
						getParentID(request.member),
					)
					.flatMap(file =>
						backend
							.getFilePath(Maybe.some(request.member))(file)
							.map(
								filePath =>
									[request.member, request.account, file, filePath] as const,
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
			!(await backend.isTokenValid(member)(req.headers.token))
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
						backend.uploadFile(uploadedFile)(file),
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

							let shouldWriteComma = true;
							if (!sentFile) {
								res.status(200);
								res.write('[');
								shouldWriteComma = false;
							}

							sentFile = true;

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
