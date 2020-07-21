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

import get from '../api/registry/get';
import conftest from '../conf.test';
import getServer, { ServerInitializationOptions } from '../getServer';
import './EitherMatcher';
import { addAccountForTransformer, prepareBasicGetRequest, resolveToEither } from './TestUtils';

describe('/api', () => {
	describe('/registry', () => {
		let server: ServerInitializationOptions;
		let registry: Registry;

		beforeEach(async done => {
			server = await getServer(conftest, 3009);

			const { schema, account } = await getTestTools(conftest);

			registry = await Registry.Get(account, schema);

			done();
		});

		afterEach(async done => {
			server.server.close();

			done();
		});

		it('should get the registry for the developer account', async done => {
			const session = await getSession(conftest);
			const req = addAccountForTransformer(
				prepareBasicGetRequest(conftest, {}, session, '/api/registry'),
				'mdx89'
			);

			const res = await resolveToEither(get.fn(req));

			expect(res).toMatchRight(registry.values);

			done();
		});

		it('should give a 400 for a non existant account', async done => {
			const session = await getSession(conftest);
			const req = addAccountForTransformer(
				prepareBasicGetRequest(conftest, {}, session, '/api/registry'),
				'noacc'
			);

			const res = await resolveToEither(get.fn(req));

			expect(res).toMatchLeft({
				code: 400,
			});

			done();
		});
	});
});
