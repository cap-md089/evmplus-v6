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

import { Collection, Schema, UndefinedToNull } from '@mysql/xdevapi';
import {
	AccountIdentifiable,
	AccountObject,
	AsyncEither,
	asyncLeft,
	asyncRight,
	destroy,
	Either,
	errorGenerator,
	FileObject,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	FullFileObject,
	get,
	Maybe,
	memoize,
	RawFileObject,
	ServerConfiguration,
	ServerError,
} from 'common-lib';
import { readFile } from 'fs';
import { join } from 'path';
import * as Client from 'ssh2-sftp-client';
import { resolveReference } from './Members';
import {
	collectResults,
	deleteItemFromCollectionA,
	findAndBindC,
	generateResults,
	safeBind,
	saveItemToCollectionA,
} from './MySQLUtil';
import { ServerEither } from './servertypes';

const getSFTPKeyFile = memoize(async (conf: ServerConfiguration) => {
	return new Promise((res, rej) => {
		readFile(conf.REMOTE_DRIVE_KEY_FILE, (err, data) => {
			if (err) {
				rej(err);
			} else {
				res(data);
			}
		});
	});
});

export const getRootFileObject = (schema: Schema) => (
	account: AccountObject,
): ServerEither<FileObject> =>
	asyncRight(
		schema.getCollection<RawFileObject>('Files'),
		errorGenerator('Could not get root file'),
	)
		.map(
			findAndBindC<RawFileObject>({
				accountID: account.id,
				parentID: 'root',
			}),
		)
		.map(collectResults)
		.map(fileChildren => fileChildren.map(get('id')))
		.map(fileChildren => ({
			accountID: account.id,
			comments: '',
			contentType: 'application/folder',
			created: 0,
			fileChildren,
			fileName: 'Drive',
			forDisplay: false,
			forSlideshow: false,
			kind: 'drive#file',
			permissions: [
				{
					permission: FileUserAccessControlPermissions.READ,
					type: FileUserAccessControlType.OTHER,
				},
			],
			id: 'root',
			parentID: null,
			owner: {
				id: 542488,
				type: 'CAPNHQMember',
			},
			folderPath: [
				{
					id: 'root',
					name: 'Drive',
				},
			],
		}));

const getFindForFile = (includeWWW: boolean) => (
	collection: Collection<UndefinedToNull<RawFileObject>>,
) => (fileObjectID: AccountIdentifiable) =>
	safeBind(
		includeWWW
			? collection.find('id = :id AND (accountID = :accountID OR accountID = "www")')
			: collection.find('id = :id AND accountID = :accountID'),
		fileObjectID,
	);

export const getFilePath = (schema: Schema) => (account: AccountObject) => (
	file: RawFileObject,
): ServerEither<
	{
		id: string;
		name: string;
	}[]
> =>
	file.parentID === 'root' || file.parentID === null
		? asyncRight(
				[
					{ id: 'root', name: 'Drive' },
					{ id: file.id, name: file.fileName },
				],
				errorGenerator('Could not get file path'),
		  )
		: getRegularFileObject()(schema)(account)(file.parentID).flatMap(parent =>
				getFilePath(schema)(account)(parent).map(path => [
					...path,
					{
						id: parent.id,
						name: parent.fileName,
					},
				]),
		  );

export const getRegularFileObject = (includeWWW = true) => (schema: Schema) => (
	account: AccountObject,
) => (fileID: string): ServerEither<RawFileObject> =>
	asyncRight(
		getFindForFile(includeWWW)(schema.getCollection<RawFileObject>('Files'))({
			accountID: account.id,
			id: fileID,
		}),
		errorGenerator('Could not get file'),
	)
		.map(collectResults)
		.filter(results => results.length === 1, {
			type: 'OTHER',
			code: 404,
			message: 'Could not find file requested',
		})
		.map(get(0))
		.flatMap(file =>
			getFilePath(schema)(account)(file)
				.map(folderPath => ({
					...file,
					folderPath,
				}))
				// Silently ignore the error, just return the file
				// Good for if a file in the path is deleted
				.leftFlatMap(() =>
					Either.right({
						...file,
						folderPath: [],
					}),
				),
		);

export const getFileObject = (includeWWW = true) => (schema: Schema) => (
	account: AccountObject,
) => (fileID: string | null): ServerEither<RawFileObject> =>
	(fileID === null
		? asyncLeft<ServerError, string>({
				type: 'OTHER',
				code: 404,
				message: 'Cannot get a file with a null file ID',
		  })
		: asyncRight<ServerError, string>(fileID, errorGenerator('Could not get requested file'))
	).flatMap(id =>
		id === 'root'
			? getRootFileObject(schema)(account)
			: getRegularFileObject(includeWWW)(schema)(account)(id),
	);

export const getFileParent = (schema: Schema) => (account: AccountObject) => (
	file: RawFileObject,
): ServerEither<RawFileObject> =>
	file.parentID === null
		? asyncLeft({
				type: 'OTHER',
				code: 400,
				message: 'Cannot get parent of orphaned file',
		  })
		: getFileObject()(schema)(account)(file.parentID);

export const expandRawFileObject = (schema: Schema) => (account: AccountObject) => (
	file: RawFileObject,
): ServerEither<FileObject> =>
	getFilePath(schema)(account)(file).map(folderPath => ({
		...file,
		folderPath,
	}));

export const expandFileObject = (schema: Schema) => (account: AccountObject) => (
	file: FileObject,
): ServerEither<FullFileObject> =>
	resolveReference(schema)(account)(file.owner)
		.map(uploader => ({
			...file,
			uploader: Maybe.some(uploader),
		}))
		.leftFlatMap(() =>
			Either.right({
				...file,
				uploader: Maybe.none(),
			}),
		);

export const saveFileObject = (schema: Schema) => (
	fileObject: RawFileObject,
): ServerEither<RawFileObject> =>
	fileObject.id === 'root'
		? asyncLeft({
				type: 'OTHER',
				code: 400,
				message: 'Cannot save root folder',
		  })
		: asyncRight(
				schema.getCollection<RawFileObject>('Files'),
				errorGenerator('Could not save file information'),
		  ).flatMap(saveItemToCollectionA(fileObject));

export const downloadFileObject = (conf: ServerConfiguration) => (file: RawFileObject) => (
	destination: NodeJS.WritableStream,
): ServerEither<void> =>
	file.contentType === 'application/folder'
		? asyncLeft({
				type: 'OTHER' as const,
				code: 400,
				message: 'Cannot download folder',
		  })
		: asyncRight(
				(async () => {
					const sftp = new Client();

					await sftp.connect({
						host: conf.REMOTE_DRIVE_HOST,
						port: conf.REMOTE_DRIVE_PORT,
						username: conf.REMOTE_DRIVE_USER,
						privateKey: await getSFTPKeyFile(conf),
					});

					await sftp.get(
						join(conf.REMOTE_DRIVE_STORAGE_PATH, `${file.accountID}-${file.id}`),
						destination,
					);

					await sftp.end();
				})(),
				errorGenerator('Could not download file'),
		  );

export const uploadFile = (conf: ServerConfiguration) => (file: RawFileObject) => (
	fileStream: NodeJS.ReadableStream,
): ServerEither<void> =>
	asyncRight(
		(async () => {
			const sftp = new Client('remote-drive');

			await sftp.connect({
				host: conf.REMOTE_DRIVE_HOST,
				port: conf.REMOTE_DRIVE_PORT,
				username: conf.REMOTE_DRIVE_USER,
				privateKey: await getSFTPKeyFile(conf),
			});

			await sftp.put(
				fileStream,
				join(conf.REMOTE_DRIVE_STORAGE_PATH, `${file.accountID}-${file.id}`),
			);

			await sftp.end();
		})(),
		errorGenerator('Could not upload file'),
	);

export const deleteFileObject = (conf: ServerConfiguration) => (schema: Schema) => (
	account: AccountObject,
) => (file: RawFileObject): ServerEither<void> =>
	file.id === 'root'
		? asyncLeft({
				type: 'OTHER' as const,
				code: 400,
				message: 'Cannot delete root folder',
		  })
		: AsyncEither.All([
				deleteItemFromCollectionA(schema.getCollection<RawFileObject>('Files'))(file),
				asyncRight(
					(async () => {
						if (file.contentType === 'application/folder') {
							return;
						}

						const sftp = new Client('remote-drive');

						await sftp.connect({
							host: conf.REMOTE_DRIVE_HOST,
							port: conf.REMOTE_DRIVE_PORT,
							username: conf.REMOTE_DRIVE_USER,
							privateKey: await getSFTPKeyFile(conf),
						});

						await sftp.delete(
							join(conf.REMOTE_DRIVE_STORAGE_PATH, `${file.accountID}-${file.id}`),
						);

						await sftp.end();
					})(),
					errorGenerator('Could not delete file'),
				),
		  ]).map(destroy);

export const getChildren = (schema: Schema) => (account: AccountObject) => (
	file: RawFileObject,
): ServerEither<AsyncIterableIterator<RawFileObject>> =>
	asyncRight(
		schema.getCollection<RawFileObject>('Files'),
		errorGenerator('Could not get file children'),
	)
		.map(
			findAndBindC<RawFileObject>({
				parentID: file.id,
				accountID: account.id,
			}),
		)
		.map(generateResults);
