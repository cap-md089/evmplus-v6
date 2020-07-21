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

import * as request from 'supertest';
import conftest from '../conf.test';
import getServer, { ServerInitializationOptions } from '../getServer';

describe('/api', () => {
	describe('/echo', () => {
		let server: ServerInitializationOptions;

		beforeEach(async done => {
			server = await getServer(conftest, 3005);

			done();
		});

		afterEach(() => {
			server.server.close();
		});

		// Test is important because certain tests for the client depend
		// on this echo service
		it('should echo what is given to it', done => {
			const payload = {
				hello: 'world',
			};

			request(server.server)
				.post('/api/echo')
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.send(payload)
				.expect(200)
				.end((err, res) => {
					if (err) {
						throw err;
					}

					expect(res.body).toEqual(payload);

					done();
				});
		});
	});
});
