#!/usr/local/bin/node --no-warnings
/**
 * Copyright (C) 2021 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { getSession } from '@mysql/xdevapi';
import { getConf } from 'server-common';
import { AccountObject } from 'common-lib';

(async () => {
	const typeFilter = new Function('account', `return !!(${process.argv[2] ?? 'true'})`) as (
		account: AccountObject,
	) => boolean;

	const flattenAccountList = (account: AccountObject) => [account.id, ...account.aliases];

	const conf = await getConf();
	const session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER,
	});

	try {
		const schema = session.getSchema(conf.DB_SCHEMA);

		const accountsCollection = schema.getCollection<AccountObject>('Accounts');

		const accounts = (await accountsCollection.find('true').execute()).fetchAll();

		console.log(accounts.filter(typeFilter).flatMap(flattenAccountList).join(','));

		return 0;
	} finally {
		await session.close();
	}
})().then(process.exit, e => {
	console.error(e);
	process.exit(1);
});
