import { Schema } from '@mysql/xdevapi';
import { RawDraftContentState } from 'draft-js';
import { DateTime } from 'luxon';
import Account from './Account';
import { collectResults, findAndBind } from './MySQLUtil';

export default class BlogPost implements BlogPostObject {
	public static async Get(
		id: number,
		account: Account,
		schema: Schema
	): Promise<BlogPost> {
		const blogPostCollection = schema.getCollection<BlogPostObject>(
			BlogPost.collectionName
		);

		let results;

		results = await collectResults(
			findAndBind(blogPostCollection, {
				id,
				accountID: account.id
			})
		);

		if (results.length !== 1) {
			throw new Error('Could not get blog post');
		}

		return new BlogPost(results[0], account, schema);
	}

	public static async Create(
		data: NewBlogPost,
		account: Account,
		schema: Schema
	): Promise<BlogPost> {
		const blogPostCollection = schema.getCollection<BlogPostObject>(
			BlogPost.collectionName
		);

		let results;

		results = await collectResults(
			findAndBind(blogPostCollection, {
				accountID: account.id
			})
		);

		const id =
			results
				.map(post => post.id)
				.reduce((prev, curr) => Math.max(prev, curr), 0) + 1;

		const posted = +DateTime.utc();

		let newPost: BlogPostObject = {
			...data,
			id,
			posted,
			accountID: account.id
		};

		// tslint:disable-next-line:variable-name
		const _id = (await blogPostCollection
			.add(newPost)
			.execute()).getGeneratedIds()[0];

		newPost = {
			...newPost,
			_id
		};

		return new BlogPost(newPost, account, schema);
	}

	private static collectionName = 'Blog';

	public authorid: number;

	public content: RawDraftContentState;

	public fileIDs: string[];

	public id: number;

	public posted: number;

	public title: string;

	// tslint:disable-next-line:variable-name
	public _id: string;

	public get accountID(): string {
		return this.account.id;
	}

	public deleted = false;

	private account: Account;

	private schema: Schema;

	private constructor(
		data: BlogPostObject,
		account: Account,
		schema: Schema
	) {
		this.set(data);

		this.account = account;
		this.schema = schema;
	}

	public async save(account: Account = this.account): Promise<void> {
		const blogPostCollection = this.schema.getCollection<BlogPostObject>(
			BlogPost.collectionName
		);

		if (!this.deleted) {
			await blogPostCollection.replaceOne(this._id, {
				...this.toRaw(),
				accountID: account.id
			});
		} else {
			throw new Error('Cannot operate on blog post that is deleted');
		}
	}

	public toRaw(): BlogPostObject {
		return {
			_id: this._id,
			id: this.id,
			authorid: this.authorid,
			content: this.content,
			fileIDs: this.fileIDs,
			posted: this.posted,
			title: this.title,
			accountID: this.account.id
		};
	}

	public set(values: Partial<BlogPostObject>): void {
		const keys: Array<keyof BlogPostObject> = [
			'_id',
			'id',
			'title',
			'authorid',
			'content',
			'fileIDs',
			'posted'
		];

		for (const i of keys) {
			if (values[i] && i !== 'accountID') {
				this[i] = values[i];
			}
		}
	}

	public async delete(): Promise<void> {
		const blogPostCollection = this.schema.getCollection<BlogPostObject>(
			BlogPost.collectionName
		);

		if (!this.deleted) {
			await blogPostCollection.removeOne(this._id);
		} else {
			throw new Error('Cannot operate on blog post that is deleted');
		}

		this.deleted = true;
	}
}
