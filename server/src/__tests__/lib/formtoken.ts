import { Schema, Session } from '@mysql/xdevapi';
import { Server } from 'http';
import * as request from 'supertest';
import { validToken } from '../../api/formtoken';
import conftest from '../../conf.test';
import getServer from '../../getServer';
import { Account, CAPNHQUser, getTestTools2 } from '../../lib/internals';
import '../EitherMatcher';
import { addAccount, addUser, getUser, prepareBasicPostRequest } from '../TestUtils';

describe('form tokens', () => {
	let account: Account;
	let schema: Schema;
	let session: Session;
	let server: Server;

	beforeAll(async done => {
		[account, schema, session] = await getTestTools2(conftest);

		server = (await getServer(conftest, 3011, session)).server;

		done();
	});

	afterAll(async done => {
		await Promise.all([
			schema
				.getCollection('Events')
				.remove('true')
				.execute(),
			session.close()
		]);

		server.close();

		done();
	});

	describe('/api/token', () => {
		it('should get a token', async done => {
			const rioux = await getUser(
				{ type: 'CAPNHQMember', id: 542488 },
				'arioux',
				schema,
				account,
				CAPNHQUser
			);

			const { body } = await request(server)
				.get('/api/token')
				.set('Authorization', rioux.sessionID);

			expect(body).toBeRight();

			await expect(
				validToken(
					addUser(
						addAccount(
							prepareBasicPostRequest(
								conftest,
								{
									token: body.value
								},
								session,
								'/api/formtoken'
							),
							account
						),
						rioux
					)
				)
			).resolves.toEqual(true);

			done();
		}, 7500);
	});
});
