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

import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	always,
	areMembersTheSame,
	AsyncEither,
	AsyncIter,
	asyncIterConcat,
	asyncIterFilter,
	asyncIterMap,
	asyncIterTap,
	asyncLeft,
	asyncRight,
	destroy,
	effectiveManageEventPermission,
	Either,
	EitherObj,
	errorGenerator,
	FileObject,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	FullFileObject,
	get,
	getFullMemberName,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	parseStringMemberReference,
	Permissions,
	RawFileObject,
	Right,
	ServerConfiguration,
	ServerError,
	stringifyMemberReference,
	toReference,
	User,
	yieldObjAsync,
} from 'common-lib';
import * as debug from 'debug';
import { createReadStream, createWriteStream, unlink } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { getMembers } from './Account';
import { resolveReference } from './Members';
import {
	collectResults,
	deleteItemFromCollectionA,
	findAndBind,
	findAndBindC,
	generateResults,
	saveItemToCollectionA,
} from './MySQLUtil';
import { ServerEither } from './servertypes';

const logFunc = debug('server-common:file');
const promisifiedUnlink = promisify(unlink);

export const EVENTS_FOLDER_ID = 'events';
export const ROOT_FOLDER_ID = 'root';
export const PERSONAL_DRIVES_FOLDER_ID = 'personalfolders';

export const getExtraRootFilesForUser = (account: AccountObject) => (
	user: MaybeObj<User>,
): RawFileObject[] => [
	getEventsFolderObject(account)(user),
	getPersonalFoldersParentFolder(account),
];

type LoadedUserFileObject<T extends boolean> = T extends true
	? { file: FileObject; fileChildrenCount: number }
	: { file: FileObject };

export const getUserFileObjectFunc = <T extends boolean>(loadFileChildrenCount: T) => (
	schema: Schema,
) => (account: AccountObject) => (requester: User) => (
	member: MemberReference | Member,
): ServerEither<LoadedUserFileObject<T>> =>
	AsyncEither.All([
		areMembersTheSame(requester)(member)
			? asyncRight(requester, errorGenerator('Could not get member information'))
			: 'contact' in member
			? asyncRight(member, errorGenerator('Could not get member information'))
			: resolveReference(schema)(account)(member),
		loadFileChildrenCount
			? asyncRight(
					schema
						.getSession()
						.sql(
							`
						SELECT
							COUNT(*) AS fileChildrenCount
						FROM
							${schema.getName()}.Files
						WHERE
							parentID = ?
						AND
							accountID = ?;
					`,
						)
						.bind([stringifyMemberReference(member), account.id])
						.execute(),
					errorGenerator('Could not get file children information'),
			  ).map(result => {
					const [[count]] = result.fetchAll();
					logFunc.extend('personaldrive').extend('raw')(
						'Raw SQL results for %s: %o',
						stringifyMemberReference(member),
						count,
					);
					return count as number;
			  })
			: asyncRight(0, errorGenerator('Could not get file children information')),
	]).map(([folderOwner, fileChildrenCount]) => {
		logFunc.extend('personaldrive')(
			'File children count for personal drive for %s: %d',
			getFullMemberName(folderOwner),
			fileChildrenCount,
		);

		const file = {
			accountID: account.id,
			comments: '',
			contentType: 'application/folder',
			created: 0,
			fileName: areMembersTheSame(folderOwner)(requester)
				? 'Personal Drive'
				: `${getFullMemberName(folderOwner)}'s Personal Drive`,
			forDisplay: false,
			forSlideshow: false,
			kind: 'drive#file',
			permissions: [
				{
					type: FileUserAccessControlType.USER,
					permission: FileUserAccessControlPermissions.FULLCONTROL,
					reference: toReference(member),
				},
			],
			id: stringifyMemberReference(member),
			parentID: areMembersTheSame(folderOwner)(requester) ? null : PERSONAL_DRIVES_FOLDER_ID,
			owner: toReference(member),
			folderPath: [
				{
					id: stringifyMemberReference(member),
					name: 'Personal Drive',
				},
			],
		};

		return loadFileChildrenCount
			? ({
					file,
					fileChildrenCount,
			  } as LoadedUserFileObject<T>)
			: ({
					file,
			  } as LoadedUserFileObject<T>);
	});
export const getUserFileObject = getUserFileObjectFunc(false);

export const getRootFileObjectForUser = (account: AccountObject) => (
	memberMaybe: MaybeObj<User>,
): FileObject => {
	const root = getRootFileObject(account);

	return {
		...root,
		folderPath: Maybe.orSome(root.folderPath)(
			Maybe.map((member: User) => [
				{
					id: stringifyMemberReference(member),
					name: 'Personal Drive',
				},
				{
					id: ROOT_FOLDER_ID,
					name: 'Drive',
				},
			])(memberMaybe),
		),
	};
};

export const getRootFileObject = (account: AccountObject): FileObject => ({
	accountID: account.id,
	comments: '',
	contentType: 'application/folder',
	created: 0,
	fileName: 'Drive',
	forDisplay: false,
	forSlideshow: false,
	kind: 'drive#file',
	permissions: [
		{
			permission: FileUserAccessControlPermissions.READ,
			type: FileUserAccessControlType.ACCOUNTMEMBER,
		},
	],
	id: ROOT_FOLDER_ID,
	parentID: null,
	owner: {
		id: 542488,
		type: 'CAPNHQMember',
	},
	folderPath: [
		{
			id: ROOT_FOLDER_ID,
			name: 'Drive',
		},
	],
});

export const getEventsFolderObject = (account: AccountObject) => (
	user: MaybeObj<User>,
): RawFileObject => ({
	accountID: account.id,
	comments: '',
	contentType: 'application/folder',
	created: 0,
	fileName: 'Events',
	forDisplay: false,
	forSlideshow: false,
	id: EVENTS_FOLDER_ID,
	kind: 'drive#file',
	owner: {
		id: 542488,
		type: 'CAPNHQMember',
	},
	parentID: ROOT_FOLDER_ID,
	permissions:
		Maybe.isNone(user) ||
		effectiveManageEventPermission(user.value) === Permissions.ManageEvent.NONE
			? []
			: [
					{
						permission:
							// Modify to help with managing of files currently there,
							// read to see the files and the folder itself
							// tslint:disable-next-line:no-bitwise
							FileUserAccessControlPermissions.MODIFY |
							FileUserAccessControlPermissions.READ,
						type: FileUserAccessControlType.USER,
						reference: toReference(user.value),
					},
			  ],
});

export const getPersonalFoldersParentFolder = (account: AccountObject): RawFileObject => ({
	accountID: account.id,
	comments: '',
	contentType: 'application/folder',
	created: 0,
	fileName: 'Personal Drive Folders',
	forDisplay: false,
	forSlideshow: false,
	id: PERSONAL_DRIVES_FOLDER_ID,
	kind: 'drive#file',
	owner: {
		id: 542488,
		type: 'CAPNHQMember',
	},
	parentID: ROOT_FOLDER_ID,

	// If someone has file management permissions (the desired state for viewing this folder),
	// they already have FULLCONTROL permissions for all files so I can just be lazy and leave
	// that out here
	permissions: [],
});

export const getFilePath = (schema: Schema) => (account: AccountObject) => (
	member: MaybeObj<User>,
) => (
	file: RawFileObject,
): ServerEither<
	{
		id: string;
		name: string;
	}[]
> =>
	// The person viewing the file has a personal drive to view
	file.id === ROOT_FOLDER_ID && Maybe.isSome(member)
		? asyncRight(
				[
					{ id: stringifyMemberReference(member.value), name: 'Personal Drive' },
					{ id: file.id, name: file.fileName },
				],
				errorGenerator('Could not get file path'),
		  )
		: // Orphan file. Has no file path
		file.parentID === null
		? asyncRight(
				[{ id: file.id, name: file.fileName }],
				errorGenerator('Could not get file path'),
		  )
		: // Person is viewing their own personal drive
		Maybe.isSome(member) &&
		  Either.isRight(parseStringMemberReference(file.parentID)) &&
		  areMembersTheSame(
				(parseStringMemberReference(file.parentID) as Right<MemberReference>).value,
		  )(member.value)
		? asyncRight(
				[
					{ id: file.parentID, name: 'Personal Drive' },
					{ id: file.id, name: file.fileName },
				],
				errorGenerator('Could not get file path'),
		  )
		: // Person is viewing someone elses personal drive
		Either.isRight(parseStringMemberReference(file.parentID))
		? getFileObject(schema)(account)(member)(PERSONAL_DRIVES_FOLDER_ID).flatMap(parentFile =>
				getFilePath(schema)(account)(member)(parentFile).map(path => [
					...path,
					{
						id: file.id,
						name: file.fileName,
					},
				]),
		  )
		: // The person is viewing a file in the root directory
		file.parentID === ROOT_FOLDER_ID
		? asyncRight(
				[
					...Maybe.orSome([] as { id: string; name: string }[])(
						Maybe.map((ref: MemberReference) => [
							{ id: stringifyMemberReference(ref), name: 'Personal Drive' },
						])(member),
					),
					{ id: ROOT_FOLDER_ID, name: 'Drive' },
					{ id: file.id, name: file.fileName },
				],
				errorGenerator('Could not get file path'),
		  )
		: // The person is viewing a file in a subfolder that isn't special enough to have a case above
		  getFileObject(schema)(account)(member)(file.parentID).flatMap(parent =>
				getFilePath(schema)(account)(member)(parent).map(path => [
					...path,
					{
						id: file.id,
						name: file.fileName,
					},
				]),
		  );

export const getRegularFileObject = (schema: Schema) => (account: AccountObject) => (
	member: MaybeObj<User>,
) => (fileID: string): ServerEither<RawFileObject> =>
	asyncRight(
		findAndBind(schema.getCollection<RawFileObject>('Files'), {
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
			getFilePath(schema)(account)(member)(file)
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

export const getFileObject = (schema: Schema) => (account: AccountObject) => (
	member: MaybeObj<User>,
) => (fileID: string | null): ServerEither<RawFileObject> =>
	(fileID === null
		? asyncLeft<ServerError, string>({
				type: 'OTHER',
				code: 404,
				message: 'Cannot get a file with a null file ID',
		  })
		: asyncRight<ServerError, string>(fileID, errorGenerator('Could not get requested file'))
	).flatMap(id =>
		id === ROOT_FOLDER_ID
			? asyncRight(
					getRootFileObjectForUser(account)(member),
					errorGenerator('Could not get requested file'),
			  )
			: id === EVENTS_FOLDER_ID
			? asyncRight(
					getEventsFolderObject(account)(member),
					errorGenerator('Could not get requested file'),
			  )
			: id === PERSONAL_DRIVES_FOLDER_ID
			? asyncRight(
					getPersonalFoldersParentFolder(account),
					errorGenerator('Could not get requested file'),
			  )
			: Either.isRight(parseStringMemberReference(id)) && Maybe.isSome(member)
			? getUserFileObject(schema)(account)(member.value)(
					(parseStringMemberReference(id) as Right<MemberReference>).value,
			  ).map(get('file'))
			: getRegularFileObject(schema)(account)(member)(id),
	);

export const expandRawFileObject = (schema: Schema) => (account: AccountObject) => (
	member: MaybeObj<User>,
) => (file: RawFileObject): ServerEither<FileObject> =>
	getFilePath(schema)(account)(member)(file).map(folderPath => ({
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
	fileObject.id === ROOT_FOLDER_ID
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
					const readStream = createReadStream(
						join(conf.DRIVE_STORAGE_PATH, `${file.accountID}-${file.id}`),
					);

					readStream.pipe(destination);

					await new Promise((resolve, reject) => {
						readStream.on('end', resolve);
						readStream.on('error', reject);
						destination.on('error', reject);
					});
				})(),
				errorGenerator('Could not download file'),
		  );

export const uploadFile = (conf: ServerConfiguration) => (file: RawFileObject) => (
	fileStream: NodeJS.ReadableStream,
): ServerEither<void> =>
	asyncRight(
		(async () => {
			const writeStream = createWriteStream(
				join(conf.DRIVE_STORAGE_PATH, `${file.accountID}-${file.id}`),
			);

			fileStream.pipe(writeStream);

			await new Promise((resolve, reject) => {
				writeStream.on('close', resolve);
				writeStream.on('error', reject);
				fileStream.on('error', reject);
			});
		})(),
		errorGenerator('Could not upload file'),
	);

export const deleteFileObject = (conf: ServerConfiguration) => (schema: Schema) => (
	account: AccountObject,
) => (file: RawFileObject): ServerEither<void> =>
	file.id === ROOT_FOLDER_ID
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

						await promisifiedUnlink(
							join(conf.DRIVE_STORAGE_PATH, `${file.accountID}-${file.id}`),
						);
					})(),
					errorGenerator('Could not delete file'),
				),
		  ]).map(destroy);

export const getChildren = (schema: Schema) => (account: AccountObject) => (
	requester: MaybeObj<User>,
) => (file: RawFileObject): ServerEither<AsyncIter<RawFileObject>> => {
	logFunc.extend('getChildren')('Getting children with query: %o', {
		parentID: file.id,
		accountID: file.accountID,
	});

	if (file.id === PERSONAL_DRIVES_FOLDER_ID && Maybe.isSome(requester)) {
		return asyncRight(
			getMembers(schema)(account)(),
			errorGenerator('Could not get member information'),
		)
			.map(asyncIterFilter<EitherObj<ServerError, Member>, Right<Member>>(Either.isRight))
			.map(asyncIterMap(get('value')))
			.map(asyncIterMap(getUserFileObjectFunc(true)(schema)(account)(requester.value)))
			.map(
				asyncIterFilter<
					EitherObj<ServerError, { file: FileObject; fileChildrenCount: number }>,
					Right<{ file: FileObject; fileChildrenCount: number }>
				>(Either.isRight),
			)
			.map(
				asyncIterFilter(personalFolder => {
					if (personalFolder.value.fileChildrenCount > 0) {
						console.log(personalFolder.value.file);
					}
					return personalFolder.value.fileChildrenCount > 0;
				}),
			)
			.map(asyncIterMap(({ value: { file: personalFile } }) => personalFile));
	} else {
		return asyncRight(
			schema.getCollection<RawFileObject>('Files'),
			errorGenerator('Could not get file children'),
		)
			.map(
				findAndBindC<RawFileObject>({
					parentID: file.id,
					accountID: file.accountID,
				}),
			)
			.map(generateResults)
			.tap(() => {
				if (Either.isRight(parseStringMemberReference(file.id))) {
					logFunc.extend('getChildren')(
						'Getting root file object, as this file is a personal drive',
					);
				}
			})
			.flatMap(results =>
				Either.isRight(parseStringMemberReference(file.id))
					? asyncRight(
							getRootFileObject({ id: file.accountID } as AccountObject),
							errorGenerator('Could not get file information'),
					  )
							.map(yieldObjAsync)
							.map(always)
							.map(asyncIterConcat(results))
					: file.id === ROOT_FOLDER_ID
					? asyncRight<ServerError, typeof results>(
							asyncIterConcat(results)(() =>
								getExtraRootFilesForUser(account)(requester),
							),
							errorGenerator('Could not get file children'),
					  )
					: asyncRight(results, errorGenerator('Could not get file children')),
			);
	}
};
