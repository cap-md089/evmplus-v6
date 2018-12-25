import APIInterface from './APIInterface';
import Account from './Account';
import MemberBase from './Members';
import { RawDraftContentState } from 'draft-js';

export default class BlogPage extends APIInterface<FullBlogPageObject>
	implements FullBlogPageObject {
	public static async Create(
		data: NewBlogPage,
		member: MemberBase,
		account: Account
	) {
		if (!member.canManageBlog()) {
			throw new Error('Invalid permissions');
		}

		const token = await BlogPage.getToken(account.id, member);

		let result;
		try {
			result = await account.fetch(
				`/api/blog/page`,
				{
					body: JSON.stringify({
						...data,
						token
					}),
					method: 'POST'
				},
				member
			);
		} catch (e) {
			throw new Error('Could not create blog page');
		}

		const newBlogPage = await result.json();

		return new BlogPage(newBlogPage, account);
	}

	public static async Get(id: string, account?: Account) {
		if (!account) {
			account = await Account.Get();
		}

		let result;
		try {
			result = await account.fetch(`/api/blog/page/${id}`);
		} catch (e) {
			throw new Error('Could not get blog page');
		}

		const blogPageData = await result.json();

		return new BlogPage(blogPageData, account);
	}

	public id: string;

	public content: RawDraftContentState;

	public title: string;

	public children: string[];

	public get accountID() {
		return this.account.id;
	}

	public ancestry: BlogPageAncestryItem[];

	public parentID: string | null;

	constructor(data: BlogPageObject, private account: Account) {
		super(account.id);

		this.id = data.id;
		this.content = data.content;
		this.title = data.title;
		this.children = data.children;
	}

	public toRaw(): FullBlogPageObject {
		return {
			accountID: this.accountID,
			children: this.children,
			content: this.content,
			id: this.id,
			title: this.title,
			parentID: this.parentID,
			ancestry: this.ancestry
		};
	}

	public set(values: Partial<NewBlogPage>) {
		for (const i in values) {
			if (values.hasOwnProperty(i)) {
				this[i] = values[i];
			}
		}
	}

	public async save(member: MemberBase, errOnInvalidPermission = false) {
		if (!member.canManageBlog()) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

		try {
			await this.fetch(
				`/api/blog/post/${this.id}`,
				{
					body: JSON.stringify({
						...this.toRaw(),
						token
					}),
					method: 'PUT'
				},
				member
			);
		} catch (e) {
			throw new Error('Could not save blog page');
		}
	}

	public getChildren() {
		return Promise.all(this.children.map(id => BlogPage.Get(id)));
	}
}
