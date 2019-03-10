import { Schema } from '@mysql/xdevapi';
import {
	DatabaseInterface,
	FileControlListItem,
	FileObject,
	FileTeamControlList,
	FileUserControlList,
	FullFileObject,
	MemberReference,
	NoSQLDocument,
	RawFileObject
} from 'common-lib';
import { FileUserAccessControlPermissions, FileUserAccessControlType } from 'common-lib/index';
import { unlink } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import conf from '../conf';
import Account from './Account';
import MemberBase from './Members';
import { collectResults, findAndBind } from './MySQLUtil';
import FileObjectValidator from './validator/validators/FileObjectValidator';

const promisedUnlink = promisify(unlink);

export default class File implements FileObject, DatabaseInterface<FileObject> {
	public static Validator = new FileObjectValidator();

	public static async Get(
		id: string | null,
		account: Account,
		schema: Schema,
		includeWWW = true
	): Promise<File> {
		if (id === null) {
			throw new Error('Cannot get file with null file ID');
		}

		if (id === 'root') {
			return File.GetRoot(account, schema);
		}

		const fileCollection = schema.getCollection<RawFileObject & Required<NoSQLDocument>>(
			File.collectionName
		);

		let results;

		try {
			if (includeWWW) {
				results = await collectResults(
					fileCollection
						.find('id = :id AND (accountID = :accountID OR accountID = "www")')
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

	private static async GetRoot(account: Account, schema: Schema): Promise<File> {
		const fileCollection = schema.getCollection<FileObject & Required<NoSQLDocument>>(
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

		const rootFile: FileObject & Required<NoSQLDocument> = {
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
			parentID: null,
			owner: {
				id: 542488,
				type: 'CAPNHQMember'
			},
			folderPath: [
				{
					id: 'root',
					name: 'Drive'
				}
			],
			_id: ''
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

	public get fileChildren() {
		return this.trueChildren;
	}

	public fileName: string = '';

	public forDisplay: boolean = false;

	public forSlideshow: boolean = false;

	public readonly kind = 'drive#file';

	public permissions: FileControlListItem[] = [];

	public get parentID() {
		return this.trueParentID;
	}

	public owner: MemberReference;

	public folderPath: Array<{ id: string; name: string }> = [];

	private account: Account;

	private schema: Schema;

	private deleted: boolean = false;

	private trueParentID: string | null = null;

	private trueChildren: string[] = [];

	private constructor(
		data: FileObject & Required<NoSQLDocument>,
		account: Account,
		schema: Schema
	) {
		this.id = data.id;
		this._id = data._id;
		this.trueChildren = data.fileChildren;
		this.contentType = data.contentType;
		this.created = data.created;
		this.trueParentID = data.parentID;
		this.folderPath = data.folderPath;
		this.owner = data.owner;

		this.account = account;
		this.schema = schema;
	}

	/**
	 * Updates the values in a secure manner
	 *
	 * @param values The values to set
	 */
	public set(data: Partial<FileObject>): boolean {
		if (File.Validator.validate(data, true)) {
			File.Validator.partialPrune(data, this);

			return true;
		} else {
			throw new Error(File.Validator.getErrorString());
		}
	}

	public async save(): Promise<void> {
		const filesCollection = this.schema.getCollection<RawFileObject>(File.collectionName);

		// Root is an imaginary imaginary file
		if (this.id === 'root') {
			return;
		}

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
		owner: this.owner
	});

	public toRaw = (): FileObject => ({
		...this.toRealRaw(),
		folderPath: this.folderPath
	});

	public toFullRaw = async (): Promise<FullFileObject> => ({
		...this.toRaw(),
		uploader: await MemberBase.ResolveReference(this.owner, this.account, this.schema, true)
	});

	public async delete(): Promise<void> {
		const filesCollection = this.schema.getCollection<FileObject>(File.collectionName);

		if (!this.deleted) {
			await Promise.all([
				filesCollection.removeOne(this._id),
				(async () => {
					const parent = await File.Get(this.parentID, this.account, this.schema);

					parent.trueChildren = parent.fileChildren.filter(x => x !== this.id);

					await parent.save();
				})(),
				(async () => {
					if (this.contentType === 'application/folder') {
						return;
					}

					await promisedUnlink(
						join(conf.fileStoragePath, `${this.account.id}-${this.id}`)
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
		member: MemberBase | null,
		permission: FileUserAccessControlPermissions
	): boolean {
		if (member) {
			if (member.hasPermission('FileManagement')) {
				return true;
			}

			if (member.matchesReference(this.owner)) {
				return true;
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

		otherPermissions.forEach(
			perm =>
				// tslint:disable-next-line:no-bitwise
				(valid = valid || (perm.permission & permission) > 0)
		);

		if (member === null || valid) {
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

		if (member) {
			memberPermissions.forEach(
				perm =>
					(valid =
						valid ||
						// tslint:disable-next-line:no-bitwise
						((perm.permission & permission) > 0 &&
							member.matchesReference(perm.reference)))
			);
		}

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

	public async addChild(file: File) {
		this.fileChildren.push(file.id);

		if (file.parentID !== 'root') {
			const parent = await File.Get(file.id, this.account, this.schema);
			parent.removeChild(file);
			await parent.save();
		}

		file.trueParentID = this.id;
	}

	public removeChild(file: File) {
		this.trueChildren = this.fileChildren.filter(id => id !== file.id);

		file.trueParentID = 'root';
	}

	public getParent() {
		if (!this.parentID) {
			throw new Error('File does not have a parent');
		}

		return File.Get(this.parentID, this.account, this.schema);
	}
}
