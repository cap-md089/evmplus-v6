import { Schema } from '@mysql/xdevapi';
import { unlink } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { isImage } from '../api/files/files/fileupload';
import conf from '../conf';
import Account from './Account';
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

		const fileCollection = schema.getCollection<FileObject>(
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

		return new File(results[0], account, schema);
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
			fileName: 'root',
			forDisplay: false,
			forSlideshow: false,
			kind: 'drive#file',
			memberOnly: false,
			id: 'root',
			parentID: '',
			uploaderID: 542488
		};

		return new File(rootFile, account, schema);
	}

	// tslint:disable-next-line:variable-name
	public _id: string;

	public id: string;

	public get accountID() {
		return this.account.id;
	}

	public comments: string;

	public contentType: string;

	public created: number;

	public fileChildren: string[];

	public fileName: string;

	public forDisplay: boolean = false;

	public forSlideshow: boolean = false;

	public readonly kind = 'drive#file';

	public memberOnly: boolean = false;

	public parentID: string;

	public uploaderID: number;

	private account: Account;

	private schema: Schema;

	private deleted: boolean = false;

	private constructor(data: FileObject, account: Account, schema: Schema) {
		this.set(data);

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
			'memberOnly',
			'parentID',
			'uploaderID'
		];

		for (const i of keys) {
			if (data[i] && (i !== 'accountID' && i !== 'kind')) {
				this[i] = data[i];
			}
		}

		const fileNameParts = data.fileName.split('.');

		// Don't mark it for display if it is not an image
		if (!isImage(fileNameParts[fileNameParts.length - 1])) {
			this.forDisplay = false;
			this.forSlideshow = false;
		}
	}

	public async save(): Promise<void> {
		const filesCollection = this.schema.getCollection<FileObject>(
			File.collectionName
		);

		if (!this.deleted) {
			filesCollection.replaceOne(this._id, this.toRaw());
		} else {
			throw new Error('Cannot operate on a deleted file');
		}
	}

	public toRaw = (): FileObject => ({
		_id: this._id,
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
		memberOnly: this.memberOnly,
		parentID: this.parentID,
		uploaderID: this.uploaderID
	});

	public async delete(): Promise<void> {
		const filesCollection = this.schema.getCollection<FileObject>(
			File.collectionName
		);

		if (!this.deleted) {
			await Promise.all([
				filesCollection.removeOne(this._id),
				promisedUnlink(
					join(conf.fileStoragePath, `${this.account.id}-${this.id}`)
				)
			]);
		} else {
			throw new Error('Cannot operate on a deleted file');
		}
	}

	public async *getChildren(includeWWW = true) {
		for (const i of this.fileChildren) {
			try {
				const file = File.Get(i, this.account, this.schema, includeWWW);

				yield file;
			} catch(e) {
				// must be a WWW file and includeWWW was false
			}
		}
	}
}
