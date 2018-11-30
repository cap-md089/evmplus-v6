import { Schema } from '@mysql/xdevapi';
import conftest from '../../conf.test';
import Account from '../../lib/Account';
import BlogPost from '../../lib/BlogPost';
import { getTestTools } from '../../lib/Util';
import { blogPostData } from '../consts';

describe('BlogPost', async () => {
	let blogPost: BlogPost;
	let id: number;
	let account: Account;
	let schema: Schema;

	beforeAll(async done => {
		const results = await getTestTools(conftest);

		account = results.account;
		schema = results.schema;

		done();
	});

	afterAll(async done => {
		await schema
			.getCollection('Blog')
			.remove('true')
			.execute();

		done();
	});

	it('should create a blog post successfully', async done => {

		blogPost = await BlogPost.Create(blogPostData, account, schema);

		id = blogPost.id;

		expect(blogPost.title).toEqual('Test blog post');

		done();
	});

	it('should update successfully', async done => {
		blogPost.set({
			title: 'New blog post title'
		});

		await blogPost.save();

		const savedPost = await BlogPost.Get(id, account, schema);

		expect(savedPost.id).toEqual(blogPost.id);
		expect(savedPost.title).toEqual('New blog post title');

		done();
	});

	it('should get values correctly', () => {
		expect(blogPost.accountID).toEqual('mdx89');
	});

	it('should delete successfully', async done => {
		await blogPost.delete();

		await expect(
			BlogPost.Get(blogPost.id, account, schema)
		).rejects.toEqual(expect.any(Error));

		await expect(blogPost.delete()).rejects.toEqual(expect.any(Error));

		await expect(blogPost.save()).rejects.toEqual(expect.any(Error));

		done();
	});
});
