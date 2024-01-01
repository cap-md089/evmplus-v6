#!/usr/local/bin/node --no-warnings
/**
 * Copyright (C) 2021 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { getSession } from '@mysql/xdevapi';
import { AccountObject } from 'common-lib';
import { conf } from 'server-common';

(async () => {
	// eslint-disable-next-line @typescript-eslint/no-implied-eval
	const typeFilter = new Function('account', `return !!(${process.argv[2] ?? 'true'})`) as (
		account: AccountObject,
	) => boolean;

	const flattenAccountList = process.argv[3]
		? // eslint-disable-next-line @typescript-eslint/no-implied-eval
		  (new Function('account', `return ${process.argv[3]}`) as (
				account: AccountObject,
		  ) => string[])
		: (account: AccountObject): string[] => [account.id, ...account.aliases];

	const config = await conf.getCLIConfiguration();
	const session = await getSession({
		host: config.DB_HOST,
		password: config.DB_PASSWORD,
		port: config.DB_PORT,
		user: config.DB_USER,
	});

	try {
		const schema = session.getSchema(config.DB_SCHEMA);

		const accountsCollection = schema.getCollection<AccountObject>('Accounts');

		const accounts = (await accountsCollection.find('true').execute()).fetchAll();

		console.log(accounts.filter(typeFilter).flatMap(flattenAccountList).join(','));

		return 0;
	} finally {
		await session.close();
	}
})().then(
	code => process.exit(code),
	e => {
		console.error(e);
		process.exit(1);
	},
);
