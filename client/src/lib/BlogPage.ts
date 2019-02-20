import APIInterface from './APIInterface';
import Account from './Account';
import MemberBase from './Members';
import { RawDraftContentState } from 'draft-js';
import { FullBlogPageObject, NewBlogPage, BlogPageAncestryItem } from 'common-lib';

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

		const result = await account.fetch(
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

		const newBlogPage = await result.json();

		return new BlogPage(newBlogPage, account);
	}

	public static async Get(id: string, account?: Account) {
		if (!account) {
			account = await Account.Get();
		}

		const result = await account.fetch(`/api/blog/page/${id}`);

		const blogPageData = await result.json();

		return new BlogPage(blogPageData, account);
	}

	public id: string;

	public content: RawDraftContentState;

	public title: string;

	public children: string[];

	public ancestry: BlogPageAncestryItem[];

	public fullChildren: BlogPageAncestryItem[];

	public parentID: string | null;

	constructor(data: FullBlogPageObject, account: Account) {
		super(account.id);

		this.id = data.id;
		this.content = data.content;
		this.title = data.title;
		this.children = data.children;
		this.fullChildren = data.fullChildren;
		this.parentID = data.parentID;
		this.ancestry = data.ancestry;
	}

	public toRaw(): FullBlogPageObject {
		return {
			accountID: this.accountID,
			children: this.children,
			content: this.content,
			id: this.id,
			title: this.title,
			parentID: this.parentID,
			ancestry: this.ancestry,
			fullChildren: this.fullChildren
		};
	}

	public set(values: Partial<NewBlogPage>) {
		for (const i in values) {
			if (values.hasOwnProperty(i)) {
				// @ts-ignore
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

		await this.fetch(
			`/api/blog/page/${this.id}`,
			{
				body: JSON.stringify({
					...this.toRaw(),
					token
				}),
				method: 'PUT'
			},
			member
		);
	}

	public getChildren() {
		return Promise.all(this.children.map(id => BlogPage.Get(id)));
	}

	public async delete(member: MemberBase, errOnInvalidPermission = false) {
		if (!member.canManageBlog()) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

		await this.fetch(
			`/api/blog/page/${this.id}`,
			{
				body: JSON.stringify({
					token
				}),
				method: 'DELETE'
			},
			member
		);
	}

	public async moveTo(
		targetPage: BlogPage,
		member: MemberBase,
		errOnInvalidPermission = false
	) {
		if (!member.canManageBlog()) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

		this.ancestry = [
			...targetPage.ancestry,
			{
				id: targetPage.id,
				title: targetPage.title
			}
		];

		this.parentID = targetPage.id;

		targetPage.fullChildren.push({
			id: this.id,
			title: this.title
		});

		await this.fetch(
			`/api/blog/page/${targetPage.id}/children/${this.id}`,
			{
				body: JSON.stringify({
					id: this.id,
					token
				}),
				method: 'POST'
			},
			member
		);
	}

	public async removeChild(
		childPage: BlogPage,
		member: MemberBase,
		errOnInvalidPermission = false
	) {
		if (!member.canManageBlog()) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		this.children = this.children.filter(child => child !== childPage.id);
		this.fullChildren = this.fullChildren.filter(
			child => child.id !== childPage.id
		);

		const token = await this.getToken(member);

		await this.fetch(
			`/api/blog/page/${this.id}/children/${childPage.id}`,
			{
				body: JSON.stringify({
					id: this.id,
					token
				}),
				method: 'POST'
			},
			member
		);
	}
}
