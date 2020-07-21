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
import conftest from '../../conf.test';

describe('Registry', () => {
	let account: Account;
	let schema: Schema;
	let session: Session;

	beforeAll(async done => {
		[account, schema, session] = await getTestTools2(conftest);

		await schema.getCollection('Registry').remove('true').execute();

		done();
	});

	afterAll(async done => {
		await Promise.all([
			schema.getCollection('Registry').remove('true').execute(),
			session.close(),
		]);

		done();
	});

	it(`should create registry values if they don't exist`, async done => {
		await Registry.Get(account, schema);

		const results = await collectResults(schema.getCollection('Registry').find('true'));

		expect(results.length).toEqual(1);

		done();
	});

	it('should get registry values', async done => {
		const reg = await Registry.Get(account, schema);

		expect(reg.values.Website.Separator).toEqual(' - ');

		done();
	});

	it('should save registry values', async done => {
		const reg = await Registry.Get(account, schema);

		reg.values.Contact.FaceBook = 'CAPStMarys';

		await reg.save();

		const regGet = await Registry.Get(account, schema);

		expect(regGet.values.Contact.FaceBook).toEqual('CAPStMarys');

		done();
	});
});
