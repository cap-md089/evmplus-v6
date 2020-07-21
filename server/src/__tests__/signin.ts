/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Schema, Session } from '@mysql/xdevapi';
import { MemberCreateError, SigninReturn, SuccessfulSigninReturn } from 'common-lib';
import * as request from 'supertest';
import { default as conf, default as conftest } from '../conf.test';
import getServer, { ServerInitializationOptions } from '../getServer';

const signinInformation = {
	username: 'ariouxTest',
	password: 'aPasswordThatSu><10',
	recaptcha: '',
};

describe('/api', () => {
	describe('/signin', () => {
		let server: ServerInitializationOptions;
		let account: Account;
		let schema: Schema;
		let session: Session;

		beforeAll(async done => {
			[account, schema, session] = await getTestTools2(conftest);

			server = await getServer(conf, 3004, session);

			await schema.getCollection('UserAccountInfo').remove('true');

			const token = await addUserAccountCreationToken(schema, {
				id: 535799,
				type: 'CAPNHQMember',
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

		afterAll(async () => {
			await Promise.all([
				schema.getCollection('UserAccountInfo').remove('member.id = 535799').execute(),
				schema.getCollection('UserAccountTokens').remove('member.id = 535799').execute(),
			]);

			await sessionStorage.close();
		});

		it('should sign in correctly', done => {
			request(server.server)
				.post('/api/signin')
				.send(signinInformation)
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.expect(200)
				.end((err, res) => {
					if (err) {
						throw err;
					}

					const ret: SuccessfulSigninReturn = res.body;

					// -1 means no error
					expect(ret.error).toEqual(-1);
					expect(ret.sessionID).not.toEqual('');
					expect(
						fromValue(ret.member)
							.map(m => m.id)
							.orNull()
					).toEqual(535799);

					done();
				});
		}, 5000);

		it('should return an error when using incorrect credentials', done => {
			request(server.server)
				.post('/api/signin')
				.send({
					...signinInformation,
					password: 'incorrect',
				})
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.expect(400)
				.end((err, res) => {
					if (err) {
						throw err;
					}

					const ret: SigninReturn = res.body;

					expect(ret.error).toEqual(0);

					done();
				});
		}, 5000);

		it('should be able to get a user after signing in', done => {
			request(server.server)
				.post('/api/signin')
				.send(signinInformation)
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.end((err, res) => {
					if (err) {
						throw err;
					}

					const body: SigninReturn = res.body;

					if (body.error !== MemberCreateError.NONE) {
						throw new Error('Could not signin');
					}

					request(server.server)
						.post('/api/check')
						.set('Accept', 'application/json')
						.set('Authorization', body.sessionID)
						.expect(200)
						.end((err1, res1) => {
							if (err) {
								throw err;
							}

							const ret: SigninReturn = res1.body;

							expect(ret.error).toEqual(-1);

							done();
						});
				});
		}, 7500);
	});
});
