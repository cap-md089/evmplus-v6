import conftest from '../../conf.test';
import BlogPost from '../../lib/BlogPost';
import { getTestTools } from '../../lib/Util';

describe('BlogPost', async () => {
	let blogPost: BlogPost;
	let id: number;

	it('should create a blog post successfully', async done => {
		const { account, schema } = await getTestTools(conftest);

		blogPost = await BlogPost.Create(
			{
				authorid: 542488,
				content: {
					blocks: [],
					entityMap: {}
				},
				fileIDs: [],
				title: 'Test blog post'
			},
			account,
			schema
		);

		id = blogPost.id;

		expect(blogPost.title).toEqual('Test blog post');

		done();
	});

	it('should update successfully', async done => {
		const { account, schema } = await getTestTools(conftest);

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
		const { account, schema } = await getTestTools(conftest);

		await blogPost.delete();

		await expect(
			BlogPost.Get(blogPost.id, account, schema)
		).rejects.toEqual(expect.any(Error));

		await expect(blogPost.delete()).rejects.toEqual(expect.any(Error));

		await expect(blogPost.save()).rejects.toEqual(expect.any(Error));

		done();
	});
});
