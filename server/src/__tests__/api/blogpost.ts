import { Schema } from '@mysql/xdevapi';
import { Server } from 'http';
import * as request from 'supertest';
import conftest from '../../conf.test';
import getServer from '../../getServer';
import Account from '../../lib/Account';
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
			let account: Account;
			let schema: Schema;

			beforeAll(async done => {
				const results = await getTestTools(conftest);

				account = results.account;
				schema = results.schema;

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
			}, 15000);

			afterAll(async () => {
				await schema
					.getCollection('Blog')
					.remove('true')
					.execute();

				server.close();
			});

			it('should get a blog post', async done => {
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

						await request(server)
							.put('/api/blog/post/1')
							.set('authorization', signinData.sessionID)
							.set('content-type', 'application/json')
							.send(
								Object.assign({ token }, blogPostData, {
									title: newTitle
								})
							)
							.expect(204);

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

				await request(server)
					.put('/api/blog/post/1')
					.set('authorization', signinData.sessionID)
					.set('content-type', 'application/json')
					.send({
						title: newTitle
					})
					.expect(403);

				const bp = await BlogPost.Get(1, account, schema);

				expect(bp.title).not.toEqual(newTitle);

				done();
			});

			it('should fail to delete a blog post without a token', async done => {
				await request(server)
					.delete('/api/blog/post/1')
					.set('authorization', signinData.sessionID)
					.set('content-type', 'application/json')
					.expect(403);

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

						await request(server)
							.delete('/api/blog/post/1')
							.set('authorization', signinData.sessionID)
							.set('content-type', 'application/json')
							.send(result.body)
							.expect(204),
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
							.expect(404)
							.end(done);
					});
			});
		});
	});
});
