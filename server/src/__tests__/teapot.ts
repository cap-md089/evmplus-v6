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

import { Server } from 'http';
import * as request from 'supertest';
import conf from '../conf.test';
import getServer from '../getServer';

describe('/teapot', () => {
	let server: Server;

	beforeEach(async () => {
		server = (await getServer(conf, 3003)).server;
	});

	afterEach(() => {
		server.close();
	});

	it('should respond with HTTP 418', done => {
		request(server).get('/teapot').expect(418, done);
	});

	it('should respond to a body of "teapot"', done => {
		request(server)
			.post('/api/echo')
			.set('Accept', 'application/json')
			.set('Content-type', 'application/json')
			.send('"teapot"')
			.expect(418, done);
	});
});
