import APIInterface from './APIInterface';
import { RawDraftContentState } from 'draft-js';
import MemberBase from './Members';
import Account from './Account';

export default class BlogPost extends APIInterface<BlogPostObject>
	implements BlogPostObject {
	public static async Create(
		data: NewBlogPost,
		member: MemberBase,
		account: Account
	) {
		if (!member.canManageBlog()) {
			throw new Error('Invalid permissions');
		}

		const token = await BlogPost.getToken(account.id, member);

		let result;
		try {
			result = await account.fetch(
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
		} catch (e) {
			throw new Error('Could not create new blog post');
		}

		const newBlogPost = await result.json();

		return new BlogPost(newBlogPost, account);
	}

	public static async Get(id: number, account?: Account | null) {
		if (!account) {
			account = await Account.Get();
		}

		let result;
		try {
			result = await account.fetch(`/api/blog/post/${id}`);
		} catch (e) {
			throw new Error('Could not get blog post');
		}

		const blogData = await result.json();

		return new BlogPost(blogData, account);
	}

	public author: MemberReference;

	public content: RawDraftContentState;

	public fileIDs: string[];

	public id: number;

	public posted: number;

	public title: string;

	constructor(data: BlogPostObject, private account: Account) {
		super(account.accountID);

		this.author = data.author;
		this.content = data.content;
		this.fileIDs = data.fileIDs;
		this.id = data.id;
		this.posted = data.posted;
		this.title = data.title;
	}

	public toRaw(): BlogPostObject {
		return {
			accountID: this.account.id,
			author: this.author,
			content: this.content,
			fileIDs: this.fileIDs,
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
		} catch(e) {
			throw new Error('Could not save blog post');
		}
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

		try {
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
		} catch(e) {
			throw new Error('Could not save blog post');
		}
	}
}
