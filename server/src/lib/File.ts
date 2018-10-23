import { Schema } from '@mysql/xdevapi';
import { unlink } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import {
	FileUserAccessControlPermissions,
	FileUserAccessControlType
} from '../../../lib/index';
import { isImage } from '../api/files/files/fileupload';
import conf from '../conf';
import Account from './Account';
import NHQMember from './members/NHQMember';
import ProspectiveMember from './members/ProspectiveMember';
import { collectResults, findAndBind } from './MySQLUtil';

const promisedUnlink = promisify(unlink);

export default class File implements FileObject, DatabaseInterface<FileObject> {
	public static async Get(
		id: string,
		account: Account,
		schema: Schema,
		includeWWW = true
	): Promise<File> {
		if (id === 'root') {
			return File.GetRoot(account, schema);
		}

		const fileCollection = schema.getCollection<RawFileObject>(
			File.collectionName
		);

		let results;

		try {
			if (includeWWW) {
				results = await collectResults(
					fileCollection
						.find(
							'id = :id AND (accountID = :accountID OR accountID = "www")'
						)
						.bind({ id, accountID: account.id })
				);
			} else {
				results = await collectResults(
					findAndBind(fileCollection, {
						id,
						accountID: account.id
					})
				);
			}
		} catch (e) {
			throw new Error('Could not get file');
		}

		if (results.length !== 1) {
			throw new Error('Could not get file');
		}

		let folderPath: Array<{ id: string; name: string }> = [
			{
				id: 'root',
				name: 'Drive'
			},
			{
				id: results[0].id,
				name: results[0].fileName
			}
		];

		if (results[0].parentID !== 'root') {
			const parent = await File.Get(results[0].parentID, account, schema);
			folderPath = [
				...parent.folderPath,
				{
					id: results[0].id,
					name: results[0].fileName
				}
			];
		}

		return new File(
			{
				...results[0],
				folderPath
			},
			account,
			schema
		);
	}

	private static collectionName = 'Files';

	private static async GetRoot(
		account: Account,
		schema: Schema
	): Promise<File> {
		const fileCollection = schema.getCollection<FileObject>(
			File.collectionName
		);

		let results;

		try {
			results = await collectResults(
				findAndBind(fileCollection, {
					parentID: 'root',
					accountID: account.id
				})
			);
		} catch (e) {
			throw new Error('Cannot get file listing');
		}

		const fileChildren = results.map(file => file.id);

		const rootFile: FileObject = {
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
					type: FileUserAccessControlType.OTHER
				}
			],
			id: 'root',
			parentID: '',
			owner: {
				id: 542488,
				kind: 'NHQMember'
			},
			folderPath: [
				{
					id: 'root',
					name: 'Drive'
				}
			]
		};

		return new File(rootFile, account, schema);
	}

	// tslint:disable-next-line:variable-name
	public _id: string = '';

	public id: string = '';

	public get accountID() {
		return this.account.id;
	}

	public comments: string = '';

	public contentType: string = '';

	public created: number = 0;

	public fileChildren: string[] = [];

	public fileName: string = '';

	public forDisplay: boolean = false;

	public forSlideshow: boolean = false;

	public readonly kind = 'drive#file';

	public permissions: FileControlListItem[] = [];

	public parentID: string = '';

	public owner: MemberReference;

	public folderPath: Array<{ id: string; name: string }> = [];

	private account: Account;

	private schema: Schema;

	private deleted: boolean = false;

	private constructor(data: FileObject, account: Account, schema: Schema) {
		this.set(data);
		this.id = data.id;
		this._id = data._id;

		this.account = account;
		this.schema = schema;
	}

	public set(data: Partial<FileObject>): void {
		const keys: Array<keyof FileObject> = [
			'comments',
			'contentType',
			'created',
			'fileChildren',
			'fileName',
			'forDisplay',
			'forSlideshow',
			'parentID',
			'owner',
			'folderPath',
			'permissions',
			'_id'
		];

		for (const i of keys) {
			if (data[i] && (i !== 'accountID' && i !== 'kind')) {
				this[i] = data[i];
			}
		}

		const fileNameParts = this.fileName.split('.');

		// Don't mark it for display if it is not an image
		if (!isImage(fileNameParts[fileNameParts.length - 1])) {
			this.forDisplay = false;
			this.forSlideshow = false;
		}
	}

	public async save(): Promise<void> {
		const filesCollection = this.schema.getCollection<RawFileObject>(
			File.collectionName
		);

		if (!this.deleted) {
			filesCollection.replaceOne(this._id, this.toRealRaw());
		} else {
			throw new Error('Cannot operate on a deleted file');
		}
	}

	public toRealRaw = (): RawFileObject => ({
		accountID: this.accountID,
		comments: this.comments,
		contentType: this.contentType,
		created: this.created,
		fileChildren: this.fileChildren,
		fileName: this.fileName,
		forDisplay: this.forDisplay,
		forSlideshow: this.forSlideshow,
		id: this.id,
		kind: 'drive#file',
		permissions: this.permissions,
		parentID: this.parentID,
		owner: this.owner,
	})

	public toRaw = (): FileObject => ({
		...this.toRealRaw(),
		folderPath: this.folderPath
	});

	public async delete(): Promise<void> {
		const filesCollection = this.schema.getCollection<FileObject>(
			File.collectionName
		);

		if (!this.deleted) {
			await Promise.all([
				filesCollection.removeOne(this._id),
				(async () => {
					const parent = await File.Get(
						this.parentID,
						this.account,
						this.schema
					);

					parent.fileChildren = parent.fileChildren.filter(
						x => x !== this.id
					);

					await parent.save();
				})(),
				(async () => {
					if (this.contentType === 'application/folder') {
						return;
					}

					await promisedUnlink(
						join(
							conf.fileStoragePath,
							`${this.account.id}-${this.id}`
						)
					);
				})()
			]);
		} else {
			throw new Error('Cannot operate on a deleted file');
		}
	}

	public async *getChildren(includeWWW = true): AsyncIterableIterator<File> {
		for (const i of this.fileChildren) {
			try {
				const file = await File.Get(i, this.account, this.schema, includeWWW);

				yield file;
			} catch (e) {
				// must be a WWW file and includeWWW was false
			}
		}
	}

	public hasPermission(
		member: NHQMember | ProspectiveMember | null,
		permission: FileUserAccessControlPermissions
	): boolean {
		if (member) {
			if (member.hasPermission('FileManagement')) {
				return true;
			}

			if (member instanceof ProspectiveMember) {
				if (
					this.owner.kind === 'ProspectiveMember' &&
					member.prospectiveID === this.owner.id
				) {
					return true;
				}
				if (
					this.owner.kind === 'NHQMember' &&
					member.id === this.owner.id
				) {
					return true;
				}
			}
		}

		const otherPermissions = this.permissions.filter(
			perm => perm.type === FileUserAccessControlType.OTHER
		);
		const signedInPermissions = this.permissions.filter(
			perm => perm.type === FileUserAccessControlType.SIGNEDIN
		);
		const accountPermissions = this.permissions.filter(
			perm => perm.type === FileUserAccessControlType.ACCOUNTMEMBER
		);
		const teamPermissions = this.permissions.filter(
			perm => perm.type === FileUserAccessControlType.TEAM
		) as FileTeamControlList[];
		const memberPermissions = this.permissions.filter(
			perm => perm.type === FileUserAccessControlType.USER
		) as FileUserControlList[];

		let valid = false;

		if (member === null) {
			otherPermissions.forEach(
				perm =>
					// tslint:disable-next-line:no-bitwise
					(valid = valid || (perm.permission & permission) > 0)
			);

			return valid;
		}

		signedInPermissions.forEach(
			perm =>
				// tslint:disable-next-line:no-bitwise
				(valid = valid || (perm.permission & permission) > 0)
		);

		if (valid) {
			return true;
		}

		accountPermissions.forEach(
			perm =>
				// tslint:disable-next-line:no-bitwise
				(valid = valid || (perm.permission & permission) > 0)
		);

		if (valid) {
			return true;
		}

		memberPermissions.forEach(
			perm =>
				(valid =
					valid ||
					(
						// tslint:disable-next-line:no-bitwise
						(perm.permission & permission) > 0 &&
						perm.reference.kind !== 'Null' &&
						perm.reference.id ===
							(member instanceof ProspectiveMember
								? member.prospectiveID
								: member.id) &&
						perm.reference.kind === member.kind
					)
				)
		);

		if (valid) {
			return true;
		}

		if (teamPermissions.length === 0) {
			return false;
		}

		member.teamIDs.forEach(i => 
			teamPermissions.forEach(
				perm =>
					(valid =
						valid ||
						(perm.teamID === i &&
							// tslint:disable-next-line:no-bitwise
							(perm.permission & permission) > 0))
			)
		);

		return valid;
	}
}
