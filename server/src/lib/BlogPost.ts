import { Schema } from '@mysql/xdevapi';
import {
	BlogPostObject,
	DatabaseInterface,
	FullBlogPostObject,
	MemberReference,
	NewBlogPost,
	NoSQLDocument
} from 'common-lib';
import { RawDraftContentState } from 'draft-js';
import { DateTime } from 'luxon';
import Account from './Account';
import MemberBase from './Members';
import { collectResults, findAndBind, generateResults } from './MySQLUtil';
import NewBlogPostValidator from './validator/validators/NewBlogPost';

export default class BlogPost implements FullBlogPostObject, DatabaseInterface<FullBlogPostObject> {
	public static Validator = new NewBlogPostValidator();

	public static async Get(
		id: number | string,
		account: Account,
		schema: Schema
	): Promise<BlogPost> {
		const blogPostCollection = schema.getCollection<BlogPostObject & Required<NoSQLDocument>>(
			BlogPost.collectionName
		);

		id = parseInt(id.toString(), 10);

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

		const author = await MemberBase.ResolveReference(results[0].author, account, schema, true);

		return new BlogPost(
			{
				...results[0],
				authorName: author.getFullName()
			},
			account,
			schema
		);
	}

	public static async Create(
		data: NewBlogPost,
		member: MemberBase,
		account: Account,
		schema: Schema
	): Promise<BlogPost> {
		const blogPostCollection = schema.getCollection<BlogPostObject>(BlogPost.collectionName);

		let results;

		results = await generateResults(
			findAndBind(blogPostCollection, {
				accountID: account.id
			})
		);

		let id = 0;

		for await (const post of results) {
			id = Math.max(id, post.id);
		}

		// Make sure it's not just the biggest post ID, but the one after
		id++;

		const posted = +DateTime.utc();

		const newPost: FullBlogPostObject = {
			...data,
			id,
			posted,
			author: member.getReference(),
			accountID: account.id,
			authorName: member.getFullName()
		};

		// tslint:disable-next-line:variable-name
		const _id = (await blogPostCollection.add(newPost).execute()).getGeneratedIds()[0];

		return new BlogPost(
			{
				...newPost,
				_id
			},
			account,
			schema
		);
	}

	private static collectionName = 'Blog';

	public author: MemberReference;

	public content: RawDraftContentState;

	public id: number;

	public posted: number;

	public title: string;

	// tslint:disable-next-line:variable-name
	public _id: string;

	public get accountID(): string {
		return this.account.id;
	}

	public authorName: string;

	private deleted = false;

	private account: Account;

	private schema: Schema;

	private constructor(
		data: FullBlogPostObject & Required<NoSQLDocument>,
		account: Account,
		schema: Schema
	) {
		this._id = data._id;
		this.content = data.content;
		this.title = data.title;
		this.id = data.id;
		this.author = data.author;
		this.posted = data.posted;
		this.authorName = data.authorName;

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

	public toRaw(): FullBlogPostObject {
		return {
			_id: this._id,
			id: this.id,
			author: this.author,
			content: this.content,
			posted: this.posted,
			title: this.title,
			accountID: this.account.id,
			authorName: this.authorName
		};
	}

	/**
	 * Updates the values in a secure manner
	 *
	 * @param values The values to set
	 */
	public set(values: Partial<BlogPostObject>) {
		if (BlogPost.Validator.validate(values, true)) {
			BlogPost.Validator.partialPrune(values, this);

			return true;
		} else {
			throw new Error(BlogPost.Validator.getErrorString());
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
