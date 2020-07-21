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

import { AddressInfo } from 'net';
import conftest from '../conf.test';
import getServer from '../getServer';

const exit = jest.spyOn(process, 'exit').mockImplementation((num: number) => num);
const error = jest.spyOn(console, 'error').mockImplementation((num: number) => num);

describe('getServer', () => {
	it('should create a server', async done => {
		const serverPromise = getServer(conftest, 3007);

		const { server } = await serverPromise;

		const address = server.address();

		expect((address as AddressInfo).port).toEqual(3007);

		server.close();

		done();
	});

	it('should throw an error if the port is in use', async done => {
		const { server: server1 } = await getServer(conftest, 3007);

		try {
			await getServer(conftest, 3007);
		} catch (e) {
			// nothing
		}

		server1.close();

		expect(exit).toHaveBeenCalled();
		expect(error).toHaveBeenCalled();

		done();
	});
});
