import { Schema } from '@mysql/xdevapi';
import conftest from '../../conf.test';
import Account from '../../lib/Account';
import BlogPage from '../../lib/BlogPage';
import { getTestTools } from '../../lib/Util';
import { blogPageData } from '../consts';

describe('BlogPost', async () => {
	let blogPost: BlogPage;
	let id: string;
	let schema: Schema;
	let account: Account;

	beforeAll(async done => {
		const results = await getTestTools(conftest);

		schema = results.schema;
		account = results.account;

		await schema
			.getCollection('BlogPages')
			.remove('true')
			.execute();

		done();
	});

	it('should create a blog page successfully', async done => {
		blogPost = await BlogPage.Create(
			'test-blog-post',
			blogPageData,
			account,
			schema
		);

		id = blogPost.id;

		expect(blogPost.title).toEqual('Test blog post');

		done();
	});

	it('should fail to create a blog post that has a used id', async done => {
		await expect(
			BlogPage.Create(
				'test-blog-post',
				blogPageData,
				account,
				schema
			)
		).rejects.toEqual(expect.any(Error));

		done();
	});

	it('should update successfully', async done => {
		blogPost.set({
			title: 'New blog post title'
		});

		await blogPost.save();

		const savedPost = await BlogPage.Get(id, account, schema);

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
			BlogPage.Get(blogPost.id, account, schema)
		).rejects.toEqual(expect.any(Error));

		await expect(blogPost.delete()).rejects.toEqual(expect.any(Error));

		await expect(blogPost.save()).rejects.toEqual(expect.any(Error));

		done();
	});
});
