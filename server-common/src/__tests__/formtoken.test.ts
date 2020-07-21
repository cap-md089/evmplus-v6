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
import { Server } from 'http';
import * as request from 'supertest';
import conftest from '../../conf.test';
import getServer from '../../getServer';
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
		await session.close();

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
									token: body.value,
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
