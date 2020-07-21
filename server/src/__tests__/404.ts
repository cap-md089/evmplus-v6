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

describe('any url that is not an image, build file, or api call', () => {
	let server: Server;

	beforeEach(async () => {
		server = (await getServer(conf, 3002)).server;
	});

	afterEach(() => {
		server.close();
	});

	it('should respond with an HTML file', done => {
		request(server)
			.get('/not/a/real/url')
			.expect('Content-type', 'text/html; charset=utf-8')
			.end(done);
	});

	it('should respond with 404', done => {
		request(server).get('/api/not/a/real/api').expect(404, done);
	});
});
