import { Schema, Session } from '@mysql/xdevapi';
import { SigninReturn } from 'common-lib';
import { Server } from 'http';
import * as request from 'supertest';
import { default as conf, default as conftest } from '../../conf.test';
import getServer from '../../getServer';
import {
	Account,
	addUserAccount,
	addUserAccountCreationToken,
	getTestTools2,
	validateUserAccountCreationToken
} from '../../lib/internals';

const signinInformation = {
	username: 'ariouxTest',
	password: 'aPasswordThatSu><10'
};

describe('/api', () => {
	describe('/signin', () => {
		let server: Server;
		let account: Account;
		let schema: Schema;
		let session: Session;

		beforeAll(async done => {
			[account, schema, session] = await getTestTools2(conftest);

			done();
		});

		beforeEach(async done => {
			server = (await getServer(conf, 3004, session)).server;

			await schema.getCollection('UserAccountInfo').remove('true');

			const token = await addUserAccountCreationToken(schema, {
				id: 535799,
				type: 'CAPNHQMember'
			});
			const memberReference = await validateUserAccountCreationToken(schema, token);

			await addUserAccount(
				schema,
				account,
				signinInformation.username,
				signinInformation.password,
				memberReference,
				token
			);

			done();
		});

		afterEach(async done => {
			server.close();

			await Promise.all([
				schema
					.getCollection('UserAccountInfo')
					.remove('member.id = 535799')
					.execute(),
				schema
					.getCollection('UserAccountTokens')
					.remove('member.id = 535799')
					.execute()
			]);

			done();
		});

		afterAll(async () => {
			await Promise.all([
				schema
					.getCollection('UserAccountInfo')
					.remove('member.id = 535799')
					.execute(),
				schema
					.getCollection('UserAccountTokens')
					.remove('member.id = 535799')
					.execute()
			]);
		});

		it('should sign in correctly', done => {
			request(server)
				.post('/api/signin')
				.send(signinInformation)
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.expect(200)
				.end((err, res) => {
					if (err) {
						throw err;
					}

					const ret: SigninReturn = res.body;

					// -1 means no error
					expect(ret.error).toEqual(-1);
					expect(ret.sessionID).not.toEqual('');
					expect(ret.valid).toEqual(true);
					expect(ret.member ? ret.member.id : 0).toEqual(535799);

					done();
				});
		}, 8000);

		it('should return an error when using incorrect credentials', done => {
			request(server)
				.post('/api/signin')
				.send({
					...signinInformation,
					password: 'incorrect'
				})
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.expect(400)
				.end((err, res) => {
					if (err) {
						throw err;
					}

					const ret: SigninReturn = res.body;

					// See lib/index.d.ts#MemberCreateError
					// It represents INCORRECT_CREDENTIALS, but unit tests cannot access
					// global types
					expect(ret.error).toEqual(0);
					expect(ret.sessionID).toEqual('');
					expect(ret.valid).toEqual(false);
					expect(ret.member).toEqual(null);

					done();
				});
		});

		it('should be able to get a user after signing in', done => {
			request(server)
				.post('/api/signin')
				.send(signinInformation)
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.end((err, res) => {
					if (err) {
						throw err;
					}

					request(server)
						.post('/api/check')
						.set('Accept', 'application/json')
						.set('Authorization', res.body.sessionID)
						.expect(200)
						.end((err1, res1) => {
							if (err) {
								throw err;
							}

							const ret: SigninReturn = res.body;

							expect(ret.error).toEqual(-1);
							expect(ret.sessionID).not.toEqual('');
							expect(ret.valid).toEqual(true);
							expect(ret.member ? ret.member.id : 0).toEqual(
								535799
							);

							done();
						});
				});
		}, 8000);

		it('should return a signin form to sign in with', done => {
			request(server)
				.get('/api/signin')
				.expect(200)
				.end((err, res) => {
					if (err) {
						throw err;
					}

					expect(res.get('Content-type')).toMatch('text/html');

					done();
				});
		});
	});
});
