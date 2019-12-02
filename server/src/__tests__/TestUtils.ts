import { Schema, Session } from '@mysql/xdevapi';
import { MemberReference } from 'common-lib';
import { IncomingHttpHeaders } from 'http';
import conf from '../conf';
import {
	Account,
	BasicAccountRequest,
	BasicMemberRequest,
	BasicMySQLRequest,
	CAPNHQUser,
	CAPProspectiveUser,
	createSessionForUser,
	getInformationForMember,
	ParamType
} from '../lib/internals';

export const getUser = async <U extends typeof CAPNHQUser | typeof CAPProspectiveUser>(
	reference: MemberReference,
	schema: Schema,
	account: Account,
	constructor: U
): Promise<InstanceType<U> | null> => {
	const accountInfo = await getInformationForMember(schema, reference);

	const session = await createSessionForUser(schema, accountInfo).fullJoin();

	// I'm ok forcing here as it gives the right return value when forced
	return (constructor.RestoreFromSession(schema, account, session) as unknown) as InstanceType<
		U
	> | null;
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
		[header]: value
	}
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
	mysqlx: mysqlxSession.getSchema(conf.database.connection.database),
	mysqlxSession,
	originalUrl: url,
	_originalUrl: url
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
	mysqlx: mysqlxSession.getSchema(conf.database.connection.database),
	mysqlxSession,
	originalUrl: url,
	_originalUrl: url
});

export const addAccount = <P extends ParamType, B>(
	req: BasicMySQLRequest<P, B>,
	account: Account
): BasicAccountRequest<P, B> => ({
	...req,
	account
});

export const addUser = <P extends ParamType, B>(
	req: BasicAccountRequest<P, B>,
	member: CAPNHQUser | CAPProspectiveUser
): BasicMemberRequest<P, B> => ({
	...req,
	member
});
