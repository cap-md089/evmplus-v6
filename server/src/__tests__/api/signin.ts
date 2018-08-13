import { Server } from 'http';
import * as request from 'supertest';
import { SigninReturn } from '../../api/signin';
import conf from '../../conf.test';
import getServer from '../../getServer';

const signinInformation = {
	username: 542488,
	password: 'application/x-httpd-PHP-091101'
};

describe ('/api', () => {
	describe ('/signin', () => {
		let server: Server;

		beforeEach(async () => {
			server = (await getServer(conf, 3004)).server;
		});

		afterEach(() => {
			server.close();
		});

		it ('should sign in correctly', done => {
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
		})

		it ('should return an error when using incorrect credentials', done => {
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
				});
		});

		it ('should succeed when using a username instead of id', done => {
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
				})
		});
	});
});