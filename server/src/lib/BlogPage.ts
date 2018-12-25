import { Schema } from '@mysql/xdevapi';
import { RawDraftContentState } from 'draft-js';
import Account from './Account';
import { collectResults, findAndBind } from './MySQLUtil';

export default class BlogPage
	implements FullBlogPageObject, DatabaseInterface<BlogPageObject> {
	public static async Get(id: string, account: Account, schema: Schema) {
		const blogPageCollection = schema.getCollection<
			FullDBObject<BlogPageObject>
		>(BlogPage.collectionName);

		const results = await collectResults(
			findAndBind(blogPageCollection, {
				accountID: account.id,
				id
			})
		);

		if (results.length !== 1) {
			throw new Error('Could not get blog page');
		}

		let ancestry: BlogPageAncestryItem[] = [];

		if (results[0].parentID !== null) {
			const parent = await BlogPage.Get(
				results[0].parentID,
				account,
				schema
			);

			ancestry = [
				...parent.ancestry,
				{
					id: parent.id,
					title: parent.title
				}
			]
		}

		return new BlogPage({
			...results[0],
			ancestry
		}, account, schema);
	}

	public static async Create(
		id: string,
		content: NewBlogPage,
		account: Account,
		schema: Schema
	) {
		const blogPageCollection = schema.getCollection<BlogPageObject>(
			BlogPage.collectionName
		);

		const results = await collectResults(
			findAndBind(blogPageCollection, {
				accountID: account.id,
				id
			})
		);

		if (results.length > 0) {
			throw new Error('ID already taken');
		}

		// tslint:disable-next-line:variable-name
		const _id = (await blogPageCollection
			.add({
				...content,
				id,
				children: [],
				accountID: account.id
			})
			.execute()).getGeneratedIds()[0];

		return new BlogPage(
			{
				...content,
				id,
				children: [],
				accountID: account.id,
				_id,
				ancestry: []
			},
			account,
			schema
		);
	}

	private static collectionName = 'BlogPages';

	public title: string = '';

	public content: RawDraftContentState = {} as RawDraftContentState;

	public id: string = '';

	// tslint:disable-next-line:variable-name
	public _id: string = '';

	public children: string[] = [];

	public get accountID() {
		return this.account.id;
	}

	public ancestry: BlogPageAncestryItem[];

	public parentID: string | null;

	private deleted: boolean = false;

	private constructor(
		data: FullDBObject<FullBlogPageObject>,
		private account: Account,
		private schema: Schema
	) {
		this.set(data);

		this._id = data._id;
	}

	/**
	 * Updates the values in a secure manner
	 * 
	 * TODO: Implement actual type checking, either return false or throw an error on failure
	 *
	 * @param values The values to set
	 */
	public set(values: Partial<BlogPageObject>): boolean {
		for (const i in values) {
			if (values.hasOwnProperty(i) && i !== 'accountID') {
				const key = i as Exclude<keyof BlogPageObject, 'accountID'>;
				this[key] = values[key];
			}
		}

		return true;
	}

	public async save() {
		if (this.deleted) {
			throw new Error('Cannot save a blog page that is deleted');
		}

		const collection = this.schema.getCollection<
			FullDBObject<BlogPageObject>
		>(BlogPage.collectionName);

		await collection.replaceOne(this._id, this.toRaw());
	}

	public toRaw = () => ({
		id: this.id,
		title: this.title,
		content: this.content,
		_id: this._id,
		accountID: this.accountID,
		children: this.children,
		parentID: this.parentID
	});

	public async *getChildren(): AsyncIterableIterator<BlogPage> {
		for await (const i of this.children) {
			yield BlogPage.Get(i, this.account, this.schema);
		}
	}

	public async delete(): Promise<void> {
		if (this.deleted) {
			throw new Error('Blog page already deleted');
		}

		this.deleted = true;

		const collection = this.schema.getCollection<BlogPageObject>(
			BlogPage.collectionName
		);

		await collection.removeOne(this._id);
	}
}
