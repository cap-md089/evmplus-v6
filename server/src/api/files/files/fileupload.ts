import * as Busboy from 'busboy';
import {
	AccountObject,
	Either,
	FileObject,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	FullFileObject,
	RawFileObject,
	SessionType,
	toReference,
	User,
	userHasFilePermission,
} from 'common-lib';
import * as fs from 'fs';
import { join } from 'path';
import {
	accountRequestTransformer,
	expandFileObject,
	getFileObject,
	getFilePath,
	MySQLRequest,
	PAM,
} from 'server-common';
import { v4 as uuid } from 'uuid';
import asyncErrorHandler from '../../../lib/asyncErrorHandler';
import saveServerError from '../../../lib/saveServerError';

export const isImage = (ending: string): boolean =>
	['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ending);

const canSaveToFolder = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

/*
	File data plan:

	1. Store FILE on disk
	2. Filename will be a UUID (there already happens to be a UUID library for tokens...)
	3. MySQL database will store METADATA (Author, filename, etc)
*/
export const func = (createWriteStream = fs.createWriteStream) =>
	asyncErrorHandler(async (req: MySQLRequest<{ parentid?: string }>, res) => {
		const parentID = req.params.parentid ?? 'root';

		const reqEither = await accountRequestTransformer(req)
			.flatMap(PAM.memberRequestTransformer(SessionType.REGULAR, true))
			.flatMap(request =>
				getFileObject(false)(req.mysqlx)(request.account)(parentID).map<
					[User, AccountObject, RawFileObject]
				>(file => [request.member, request.account, file])
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

		const [member, account, parent] = reqEither.value;

		if (
			typeof req.headers.token !== 'string' ||
			!(await PAM.isTokenValid(req.mysqlx, member, req.headers.token)) ||
			!canSaveToFolder(member)(parent)
		) {
			res.status(403);
			res.end();
			return;
		}

		const id = uuid().replace(/-/g, '');
		const realFilename = `${account.id}-${id}`;
		const created = Date.now();
		const fileWriteStream = createWriteStream(
			join(req.configuration.DRIVE_STORAGE_PATH, realFilename)
		);

		const filesCollection = req.mysqlx.getCollection<RawFileObject>('Files');
		const owner = toReference(member);

		const busboy = new Busboy({
			headers: req.headers,
			limits: {
				files: 1,
				fields: 1,
			},
		});

		req.pipe(busboy);

		let sentFile = false;

		busboy.on('file', (fieldName, file, fileName, encoding, contentType) => {
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
						type: FileUserAccessControlType.OTHER,
						permission: FileUserAccessControlPermissions.READ,
					},
				],
				owner,
				parentID,
			};

			file.pipe(fileWriteStream);

			Promise.all([
				new Promise(resolve => {
					file.on('end', () => {
						fileWriteStream.close();
						resolve();
					});
				}),
				filesCollection.add(uploadedFile).execute(),
			])
				.then(async () => {
					const fullFileObject: FullFileObject = await getFileObject(false)(req.mysqlx)(
						account
					)(id)
						.flatMap<FullFileObject>(newFile =>
							getFilePath(req.mysqlx)(account)(newFile)
								.map<FileObject>(folderPath => ({
									...newFile,
									folderPath,
								}))
								.flatMap<FullFileObject>(expandFileObject(req.mysqlx)(account))
						)
						.fullJoin();

					res.json(fullFileObject);

					await req.mysqlxSession.close();
				})
				.catch(err => {
					saveServerError(err, req);
					res.status(500);
					res.end();
				});
		});

		busboy.on('end', () => {
			if (!sentFile) {
				res.status(400);
				res.end();
			}
		});
	});

export default func();
