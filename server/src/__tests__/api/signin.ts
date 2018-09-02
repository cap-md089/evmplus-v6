import { Server } from 'http';
import * as request from 'supertest';
import conf from '../../conf.test';
import getServer from '../../getServer';

const signinInformation = {
	username: 542488,
	password: 'app/xPHP091101'
};

describe('/api', () => {
	describe('/signin', () => {
		let server: Server;

		beforeEach(async () => {
			server = (await getServer(conf, 3004)).server;
		});

		afterEach(() => {
			server.close();
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
					expect(ret.member.id).toEqual(signinInformation.username);

					done();
				});
		});

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

		it('should succeed when using a username instead of id', done => {
			request(server)
				.post('/api/signin')
				.send({
					...signinInformation,
					username: 'riouxad'
				})
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
					expect(ret.member.id).toEqual(signinInformation.username);

					done();
				});
		});

		it('should be able to get a user after signing in', done => {
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
							expect(ret.member.id).toEqual(signinInformation.username);

							done();
						});
				});
		})

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
