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

import { getSession, Schema, Session } from '@mysql/xdevapi';
import {
	AccountType,
	Configuration,
	Maybe,
	RawCAPEventAccountObject,
	RawCAPSquadronAccountObject,
	EitherObj,
	Either,
} from 'common-lib';
import 'common-lib/dist/test';

let testSession: Session;

type TestTools = [Schema, RawCAPSquadronAccountObject, Session] & {
	sqAccount: RawCAPSquadronAccountObject;
	evtAccount: RawCAPEventAccountObject;
	schema: Schema;
	session: Session;
};

export const testTools = async (conf: Configuration): Promise<TestTools> => {
	const sqAccount: RawCAPSquadronAccountObject = {
		type: AccountType.CAPSQUADRON,
		aliases: [],
		comments: '',
		discordServer: Maybe.none(),
		displayName: "St Mary's Test",
		id: 'mdx89',
		mainCalendarID: '',
		mainOrg: 916,
		orgIDs: [916, 2529],
		parent: Maybe.none(),
		serviceAccount: Maybe.none(),
		shareLink: '',
		wingCalendarID: '',
	};

	const evtAccount: RawCAPEventAccountObject = {
		type: AccountType.CAPEVENT,
		aliases: [],
		comments: '',
		discordServer: Maybe.none(),
		displayName: 'ALS',
		id: 'md001als',
		mainCalendarID: '',
		parent: Maybe.none(),
		serviceAccount: Maybe.none(),
		shareLink: '',
		wingCalendarID: '',
	};

	testSession =
		testSession ||
		(await getSession({
			user: conf.database.connection.user,
			password: conf.database.connection.password,
			host: conf.database.connection.host,
			port: conf.database.connection.port,
		}));

	if (testSession === undefined) {
		throw new Error('Could not get MySQL session!');
	}

	const schema = testSession.getSchema(conf.database.connection.database);

	// @ts-ignore
	const returnValue: TestTools = [schema, sqAccount, testSession];

	returnValue.sqAccount = sqAccount;
	returnValue.evtAccount = evtAccount;
	returnValue.schema = schema;
	returnValue.session = testSession;

	return returnValue;
};

export const assertRight = <T>(eith: EitherObj<any, T>): T => {
	if (Either.isLeft(eith)) {
		throw new Error('Either object is left');
	}

	return eith.value;
};
