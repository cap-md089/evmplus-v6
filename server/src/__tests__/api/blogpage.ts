import { Schema } from '@mysql/xdevapi';
import { BlogPageObject, SigninReturn } from 'common-lib';
import { Server } from 'http';
import * as request from 'supertest';
import conftest from '../../conf.test';
import getServer from '../../getServer';
import Account from '../../lib/Account';
import BlogPage from '../../lib/BlogPage';
import { NHQMember } from '../../lib/Members';
import { getTestTools } from '../../lib/Util';
import { blogPageData, signinInformation } from '../consts';

describe('/api', () => {
	describe('/blog', () => {
		describe('/page', () => {
			let server: Server;
			let signinData: SigninReturn;
			let schema: Schema;
			let account: Account;
			let member: NHQMember;

			beforeAll(async done => {
				const results = await getTestTools(conftest);

				schema = results.schema;
				account = results.account;

				server = (await getServer(conftest, 3011)).server;

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
				await schema
					.getCollection('BlogPages')
					.remove('true')
					.execute();

				server.close();
			});

			it('should get a blog page', async done => {
				const id = 'a-test-page';

				const bp = await BlogPage.Create(
					id,
					blogPageData,
					account,
					schema
				);

				request(server)
					.get('/api/blog/page/' + bp.id)
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

			it('should throw a 404 for a lost blog page', async done => {
				request(server)
					.get('/api/blog/page/not-a-page')
					.expect(404, done);
			});

			it('should create a blog page', async done => {
				request(server)
					.get('/api/token')
					.set('authorization', signinData.sessionID)
					.end((err, result) => {
						if (err) {
							throw err;
						}

						const { token } = result.body;

						request(server)
							.post('/api/blog/page')
							.set('authorization', signinData.sessionID)
							.send({
								page: blogPageData,
								id: 'a-test-page',
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

								const bpObj = result2.body as BlogPageObject;

								expect(bpObj.children).toEqual([]);
								expect(bpObj.title).toEqual(blogPageData.title);

								done();
							});
					});
			});

			it('should get a list of blog pages', async done => {
				request(server)
					.get('/api/blog/page')
					.expect(200)
					.end((err, res) => {
						if (err) {
							throw err;
						}

						expect(res.body.length).toEqual(1);
						expect(res.body[0].title).toEqual(blogPageData.title);

						done();
					});
			});

			it('should fail to create a blog page without a token', async done => {
				request(server)
					.post('/api/blog/page')
					.set('authorization', signinData.sessionID)
					.set('content-type', 'application/json')
					.send(blogPageData)
					.expect(403, done);
			});

			it('should edit a blog page', async done => {
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
							.put('/api/blog/page/a-test-page')
							.set('authorization', signinData.sessionID)
							.set('content-type', 'application/json')
							.send(
								Object.assign({ token }, blogPageData, {
									title: newTitle
								})
							)
							.expect(204);

						const bp = await BlogPage.Get(
							'a-test-page',
							account,
							schema
						);

						expect(bp.title).toEqual(newTitle);

						done();
					});
			});

			it('should throw a 404 for editing a lost blog page', async done => {
				request(server)
					.get('/api/token')
					.set('authorization', signinData.sessionID)
					.end(async (err, result) => {
						if (err) {
							throw err;
						}

						request(server)
							.put('/api/blog/page/3000')
							.set('authorization', signinData.sessionID)
							.set('content-type', 'application/json')
							.send(
								Object.assign(result.body, blogPageData, {
									title: 'a new title 2'
								})
							)
							.expect(404);

						done();
					});
			});

			it('should fail to edit a blog page without a token', async done => {
				const newTitle = 'a new title 2';

				await request(server)
					.put('/api/blog/page/a-test-page')
					.set('authorization', signinData.sessionID)
					.set('content-type', 'application/json')
					.send({
						title: newTitle
					})
					.expect(403);

				const bp = await BlogPage.Get('a-test-page', account, schema);

				expect(bp.title).not.toEqual(newTitle);

				done();
			});

			it('should fail to delete a blog page without a token', async done => {
				await request(server)
					.delete('/api/blog/page/a-test-page')
					.set('authorization', signinData.sessionID)
					.set('content-type', 'application/json')
					.expect(403);

				await expect(
					BlogPage.Get('a-test-page', account, schema)
				).resolves.toEqual(expect.any(BlogPage));

				done();
			});

			it('should delete a blog page', async done => {
				request(server)
					.get('/api/token')
					.set('authorization', signinData.sessionID)
					.end(async (err, result) => {
						if (err) {
							throw err;
						}

						await request(server)
							.delete('/api/blog/page/a-test-page')
							.set('authorization', signinData.sessionID)
							.set('content-type', 'application/json')
							.send(result.body)
							.expect(204);

						await expect(
							BlogPage.Get('a-test-page', account, schema)
						).rejects.toEqual(expect.any(Error));

						done();
					});
			});

			it('should throw a 404 for deleting a lost blog page', async done => {
				request(server)
					.get('/api/token')
					.set('authorization', signinData.sessionID)
					.end(async (err, result) => {
						if (err) {
							throw err;
						}

						request(server)
							.delete('/api/blog/page/a-test-page')
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
