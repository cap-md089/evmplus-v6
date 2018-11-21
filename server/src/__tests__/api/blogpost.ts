import { Server } from 'http';
import * as request from 'supertest';
import conftest from '../../conf.test';
import getServer from '../../getServer';
import BlogPost from '../../lib/BlogPost';
import { NHQMember } from '../../lib/Members';
import { getTestTools } from '../../lib/Util';
import { blogPostData, signinInformation } from '../consts';

describe('/api', () => {
	describe('/blog', () => {
		describe('/post', () => {
			let server: Server;
			let member: NHQMember;
			let signinData: SigninReturn;

			beforeAll(async done => {
				const { schema, account } = await getTestTools(conftest);

				server = (await getServer(conftest, 3010)).server;

				[member, signinData] = await Promise.all([
					NHQMember.Create(
						signinInformation.username,
						signinInformation.password,
						schema,
						account
					),
					new Promise<SigninReturn>(res => {
						request(server)
							.post('/api/signin')
							.send(signinInformation)
							.set('Accept', 'application/json')
							.set('Content-type', 'application/json')
							.expect(200)
							.end((err, result) => {
								if (err) {
									throw err;
								}

								res(result.body);
							});
					})
				]);

				done();
			}, 10000);

			afterAll(async () => {
				const { schema } = await getTestTools(conftest);

				await schema
					.getCollection('Blog')
					.remove('true')
					.execute();

				server.close();
			});

			it('should get a blog post', async done => {
				const { account, schema } = await getTestTools(conftest);

				const bp = await BlogPost.Create(blogPostData, account, schema);

				request(server)
					.get('/api/blog/post/' + bp.id)
					.expect('content-type', 'application/json; charset=utf-8')
					.expect(200)
					.end(async err => {
						await bp.delete();

						if (err) {
							throw err;
						}

						done();
					});
			});

			it('should throw a 404 for a lost blog post', async done => {
				request(server)
					.get('/api/blog/post/30000')
					.expect(404, done);
			});

			it('should create a blog post', async done => {
				request(server)
					.get('/api/token')
					.set('authorization', signinData.sessionID)
					.end((err, result) => {
						if (err) {
							throw err;
						}

						const { token } = result.body;

						request(server)
							.post('/api/blog/post')
							.set('authorization', signinData.sessionID)
							.send({
								...blogPostData,
								token
							})
							.set('content-type', 'application/json')
							.expect(
								'content-type',
								'application/json; charset=utf-8'
							)
							.expect(200)
							.end(async (err2, result2) => {
								if (err2) {
									throw err2;
								}

								const bpObj = result2.body as BlogPostObject;

								expect(bpObj.authorid).toEqual(
									member.getReference()
								);
								expect(bpObj.title).toEqual(blogPostData.title);

								done();
							});
					});
			});

			it('should get a list of blog posts', async done => {
				request(server)
					.get('/api/blog/post')
					.expect(200)
					.end((err, res) => {
						if (err) {
							throw err;
						}

						expect(res.body.length).toEqual(1);
						expect(res.body[0].title).toEqual(blogPostData.title);

						done();
					});
			});

			it('should fail to create a blog post without a token', async done => {
				request(server)
					.post('/api/blog/post')
					.set('authorization', signinData.sessionID)
					.set('content-type', 'application/json')
					.send(blogPostData)
					.expect(403, done);
			});

			it('should edit a blog post', async done => {
				request(server)
					.get('/api/token')
					.set('authorization', signinData.sessionID)
					.end(async (err, result) => {
						if (err) {
							throw err;
						}

						const newTitle = 'a new title';

						const { token } = result.body;

						const [, { account, schema }] = await Promise.all([
							request(server)
								.put('/api/blog/post/1')
								.set('authorization', signinData.sessionID)
								.set('content-type', 'application/json')
								.send(
									Object.assign({ token }, blogPostData, {
										title: newTitle
									})
								)
								.expect(204),
							getTestTools(conftest)
						]);

						const bp = await BlogPost.Get(1, account, schema);

						expect(bp.title).toEqual(newTitle);

						done();
					});
			});

			it('should throw a 404 for editing a lost blog post', async done => {
				request(server)
					.get('/api/token')
					.set('authorization', signinData.sessionID)
					.end(async (err, result) => {
						if (err) {
							throw err;
						}

						request(server)
							.put('/api/blog/post/3000')
							.set('authorization', signinData.sessionID)
							.set('content-type', 'application/json')
							.send(
								Object.assign(result.body, blogPostData, {
									title: 'a new title 2'
								})
							)
							.expect(404);

						done();
					});
			});

			it('should fail to edit a blog post without a token', async done => {
				const newTitle = 'a new title 2';

				const [, { account, schema }] = await Promise.all([
					request(server)
						.put('/api/blog/post/1')
						.set('authorization', signinData.sessionID)
						.set('content-type', 'application/json')
						.send({
							title: newTitle,
							testme: true
						})
						.expect(403),
					getTestTools(conftest)
				]);

				const bp = await BlogPost.Get(1, account, schema);

				expect(bp.title).not.toEqual(newTitle);

				done();
			});

			it('should fail to delete a blog post without a token', async done => {
				const [, { account, schema }] = await Promise.all([
					request(server)
						.delete('/api/blog/post/1')
						.set('authorization', signinData.sessionID)
						.set('content-type', 'application/json')
						.expect(403),
					getTestTools(conftest)
				]);

				await expect(BlogPost.Get(1, account, schema)).resolves.toEqual(
					expect.any(BlogPost)
				);

				done();
			});

			it('should delete a blog post', async done => {
				request(server)
					.get('/api/token')
					.set('authorization', signinData.sessionID)
					.end(async (err, result) => {
						if (err) {
							throw err;
						}

						const [, { account, schema }] = await Promise.all([
							request(server)
								.delete('/api/blog/post/1')
								.set('authorization', signinData.sessionID)
								.set('content-type', 'application/json')
								.send(result.body)
								.expect(204),
							getTestTools(conftest)
						]);

						await expect(
							BlogPost.Get(1, account, schema)
						).rejects.toEqual(expect.any(Error));

						done();
					});
			});

			it('should throw a 404 for deleting a lost blog post', async done => {
				request(server)
					.get('/api/token')
					.set('authorization', signinData.sessionID)
					.end(async (err, result) => {
						if (err) {
							throw err;
						}

						request(server)
							.delete('/api/blog/post/3000')
							.set('authorization', signinData.sessionID)
							.set('content-type', 'application/json')
							.send(result.body)
							.expect(404);

						done();
					});
			});
		});
	});
});
