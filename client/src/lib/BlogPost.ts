import APIInterface from './APIInterface';
import { RawDraftContentState } from 'draft-js';
import MemberBase from './Members';
import Account from './Account';

export default class BlogPost extends APIInterface<BlogPostObject>
	implements FullBlogPostObject {
	public static async Create(
		data: NewBlogPost,
		member: MemberBase,
		account: Account
	) {
		if (!member.canManageBlog()) {
			throw new Error('Invalid permissions');
		}

		const token = await BlogPost.getToken(account.id, member);

		const result = await account.fetch(
			`/api/blog/post`,
			{
				body: JSON.stringify({
					...data,
					token
				}),
				method: 'POST'
			},
			member
		);

		const newBlogPost = await result.json();

		return new BlogPost(newBlogPost, account);
	}

	public static async Get(id: number, account?: Account | null) {
		if (!account) {
			account = await Account.Get();
		}

		const result = await account.fetch(`/api/blog/post/${id}`);

		const blogData = await result.json() as FullBlogPostObject;

		return new BlogPost(blogData, account);
	}

	public author: MemberReference;

	public content: RawDraftContentState;

	public id: number;

	public posted: number;

	public title: string;

	public authorName: string;

	constructor(data: FullBlogPostObject, private account: Account) {
		super(account.accountID);

		this.author = data.author;
		this.content = data.content;
		this.id = data.id;
		this.posted = data.posted;
		this.title = data.title;
		this.authorName = data.authorName;
	}

	public toRaw(): BlogPostObject {
		return {
			accountID: this.account.id,
			author: this.author,
			content: this.content,
			id: this.id,
			posted: this.posted,
			title: this.title
		};
	}

	public set(values: Partial<NewBlogPost>) {
		for (const i in values) {
			if (values.hasOwnProperty(i)) {
				this[i] = values[i];
			}
		}
	}

	public async save(member: MemberBase, errOnInvalidPermission = false) {
		if (
			!member.canManageBlog()
		) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

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
	}

	public async delete(member: MemberBase, errOnInvalidPermission = false) {
		if (
			!member.canManageBlog()
		) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

		await this.fetch(
			`/api/blog/post/${this.id}`,
			{
				body: JSON.stringify({
					token
				}),
				method: 'DELETE'
			},
			member
		);
	}
}
