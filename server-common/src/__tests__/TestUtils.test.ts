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
import { api, AsyncEither, EitherObj, MemberReference } from 'common-lib';
import { EventEmitter } from 'events';
import { IncomingHttpHeaders } from 'http';
import conf from '../conf';

jest.setTimeout(30000);

export const testNormalize = (obj: any) => JSON.parse(JSON.stringify(obj));
export const tNorm = testNormalize;

export const getUser = async <U extends typeof CAPNHQUser | typeof CAPProspectiveUser>(
	reference: MemberReference,
	username: string,
	schema: Schema,
	account: Account,
	constructor: U
): Promise<InstanceType<U>> => {
	try {
		const accountInfo = await getInformationForMember(schema, reference);

		const session = await createSessionForUser(schema, accountInfo).fullJoin();

		// I'm ok forcing here as it gives the right return value when forced
		return (constructor.RestoreFromSession(
			schema,
			account,
			session
		) as unknown) as InstanceType<U>;
	} catch (e) {
		const token = await addUserAccountCreationToken(schema, reference);

		const accountInfo = await addUserAccount(
			schema,
			account,
			username,
			'aPassw0rdThatSu><',
			reference,
			token
		);

		const session = await createSessionForUser(schema, accountInfo).fullJoin();

		return (constructor.RestoreFromSession(
			schema,
			account,
			session
		) as unknown) as InstanceType<U>;
	}
};

export const addHeader = <
	R extends BasicMySQLRequest<P, B>,
	P extends ParamType,
	B,
	H extends keyof IncomingHttpHeaders = keyof IncomingHttpHeaders
>(
	req: R,
	header: H,
	value: IncomingHttpHeaders[H]
): R => ({
	...req,
	headers: {
		...req.headers,
		[header]: value,
	},
});

export const prepareBasicGetRequest = <P extends ParamType = {}>(
	configuration: typeof conf,
	params: P,
	mysqlxSession: Session,
	url: string
): BasicMySQLRequest<P, any> => ({
	body: undefined,
	params,
	configuration,
	headers: {},
	hostname: 'mdx89.capunit.com',
	method: 'GET',
	memberUpdateEmitter: new EventEmitter(),
	mysqlx: mysqlxSession.getSchema(configuration.database.connection.database),
	mysqlxSession,
	originalUrl: url,
	_originalUrl: url,
});

export const prepareBasicPostRequest = <B = any>(
	configuration: typeof conf,
	body: B,
	mysqlxSession: Session,
	url: string
): BasicMySQLRequest<{}, B> => ({
	body,
	params: {},
	configuration,
	headers: {},
	hostname: 'mdx89.capunit.com',
	method: 'POST',
	memberUpdateEmitter: new EventEmitter(),
	mysqlx: mysqlxSession.getSchema(configuration.database.connection.database),
	mysqlxSession,
	originalUrl: url,
	_originalUrl: url,
});

export const addAccount = <P extends ParamType, B>(
	req: BasicMySQLRequest<P, B>,
	account: Account
): BasicAccountRequest<P, B> => ({
	...req,
	account,
});

export const addAccountForTransformer = <P extends ParamType, B>(
	req: BasicMySQLRequest<P, B>,
	account: Account | string
): BasicMySQLRequest<P, B> => ({
	...req,
	hostname: `${typeof account === 'string' ? account : account.id}.capunit.com`,
});

export const addUser = <P extends ParamType, B>(
	req: BasicAccountRequest<P, B>,
	member: CAPNHQUser | CAPProspectiveUser
): BasicMemberRequest<P, B> => ({
	...req,
	member,
});

export const addUserForTransformer = <P extends ParamType, B>(
	req: BasicMySQLRequest<P, B>,
	member: CAPNHQUser | CAPProspectiveUser
): BasicMySQLRequest<P, B> => addHeader(req, 'authorization', member.sessionID);

export const resolveAPI = <T>(
	v: Promise<EitherObj<api.ServerError, T>> | AsyncEither<api.ServerError, T>
): Promise<T> =>
	v instanceof Promise
		? v.then(eith =>
				eith.direction === 'left' ? Promise.reject(eith.value) : Promise.resolve(eith.value)
		  )
		: v
				.join()
				.then(eith =>
					eith.direction === 'left'
						? Promise.reject(eith.value)
						: Promise.resolve(eith.value)
				);

export const resolveToEither = <T extends EitherObj<api.ServerError, any>>(
	v: Promise<T> | AsyncEither<api.ServerError, any>
) => (v instanceof Promise ? v : v.join());
