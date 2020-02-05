import * as mysql from '@mysql/xdevapi';
import {
	api,
	AsyncEither,
	asyncRight,
	either,
	EitherObj,
	just,
	left,
	MultCheckboxReturn,
	RawAccountObject,
	right
} from 'common-lib';
import * as express from 'express';
import { Configuration } from '../conf';
import { BasicAccountRequest } from './Account';
import {
	Account,
	AccountRequest,
	BasicConditionalMemberRequest,
	BasicMySQLRequest,
	memberRequestTransformer,
	ParamType,
	saveServerError
} from './internals';
import { BasicMaybeMemberRequest } from './member/pam/Session';

export function extend<T extends object, S extends object>(obj1: T, obj2: S): T & S {
	const ret = {} as any;
	for (const i in obj1) {
		if (obj1.hasOwnProperty(i)) {
			ret[i] = obj1[i];
		}
	}
	for (const i in obj2) {
		if (obj2.hasOwnProperty(i)) {
			ret[i] = obj2[i];
		}
	}
	return ret;
}

export async function orderlyExecute<T, S>(
	promiseFunction: (val: S) => Promise<T>,
	values: S[]
): Promise<T[]> {
	const ret: T[] = [];
	for (const i of values) {
		ret.push(await promiseFunction(i));
	}
	return ret;
}

export const json = <T>(res: express.Response, values: T | Promise<T>) =>
	values instanceof Promise
		? values.then(val => {
				res.json(values);
		  })
		: res.json(values);

export async function streamAsyncGeneratorAsJSONArray<T>(
	res: express.Response,
	iterator: AsyncIterableIterator<T>,
	functionHandle: (val: T) => Promise<string | false> | string | false = JSON.stringify
): Promise<void> {
	res.header('Content-type', 'application/json');

	let started = false;

	for await (const i of iterator) {
		const value = await functionHandle(i);
		if (value !== false) {
			res.write((started ? ',' : '[') + value);
			started = true;
		}
	}

	// Will happen if the iterator returned nothing, or the map
	// function returned false for every item
	if (!started) {
		res.write('[');
	}

	res.write(']');
	res.end();
}

// Maybe can be used to help with JSON serialization? Doesn't seem to work...
// type FunctionLess<R> = {
// 	[P in keyof R]: R[P] extends () => void
// 		? never
// 		: R[P] extends Array<infer U>
// 		? Array<FunctionLess<U>>
// 		: R[P] extends object
// 		? FunctionLess<R[P]>
// 		: R[P]
// };

export async function streamAsyncGeneratorAsJSONArrayTyped<T, R>(
	res: express.Response,
	iterator: AsyncIterableIterator<T>,
	functionHandle: (val: T) => Promise<R | false> | R | false
): Promise<void> {
	streamAsyncGeneratorAsJSONArray(res, iterator, async val => {
		const x = (await functionHandle(val)) as any;
		if (x === false) {
			return x;
		} else {
			return JSON.stringify(x);
		}
	});
}

let testSession: mysql.Session;
let testAccount: Account;
// let testHuckabeeUser: CAPNHQUser;
// let testHuckabeeUserInfo: UserAccountInformation;
// let testRiouxUser: CAPNHQUser;
// let testRiouxUserInfo: UserAccountInformation;

export async function getMigrateAccount(testconf: typeof Configuration, inId: string) {
	const conn = testconf.database.connection;

	testSession =
		testSession ||
		(await mysql.getSession({
			user: conn.user,
			password: conn.password,
			host: conn.host,
			port: conn.port
		}));

	if (testSession === undefined) {
		throw new Error('Could not get MySQL session!');
	}

	const schema = testSession.getSchema(testconf.database.connection.database);

	if (schema === undefined) {
		throw new Error('Could not get migrate schema!');
	}

	try {
		testAccount = testAccount || (await Account.Get(inId, schema));
	} catch (e) {
		throw new Error('Could not get account!');
	}

	return {
		account: testAccount,
		schema,
		session: testSession
	};
}

export async function getTestTools(testconf: typeof Configuration) {
	const devAccount: RawAccountObject = {
		adminIDs: [
			{
				id: 542488,
				type: 'CAPNHQMember'
			}
		],
		mainCalendarID: "r2lu9p16lh7qa5r69bv14h85i8@group.calendar.google.com",
		wingCalendarID: "6t22lk6thigsg6udc7rkpap2tg@group.calendar.google.com",
		serviceAccount: "md089-capunit-calendar@md089-capunit.iam.gserviceaccount.com",
		shareLink: "",
		embedLink: "",
		initialPassword: "",
		comments: "",
		echelon: false,
		expires: 99999999999999,
		id: 'mdx89',
		mainOrg: 916,
		orgIDs: [916, 2529],
		paid: true,
		paidEventLimit: 500,
		unpaidEventLimit: 5,
		aliases: ['test']
	};

	const conn = testconf.database.connection;

	testSession =
		testSession ||
		(await mysql.getSession({
			user: conn.user,
			password: conn.password,
			host: conn.host,
			port: conn.port
		}));

	if (testSession === undefined) {
		throw new Error('Could not get MySQL session!');
	}

	const schema = testSession.getSchema(testconf.database.connection.database);

	if (schema === undefined) {
		throw new Error('Could not get test schema!');
	}

	try {
		testAccount = testAccount || (await Account.Get('mdx89', schema));
	} catch (e) {
		testAccount = await Account.Create(devAccount, schema);
	}

	// 626814

	return {
		account: testAccount,
		schema,
		session: testSession
	};
}

export async function getTestTools2(
	testconf: typeof Configuration
): Promise<[Account, mysql.Schema, mysql.Session]> {
	const results = await getTestTools(testconf);

	return [results.account, results.schema, results.session];
}

export interface ExtendedResponse extends express.Response {
	sjson: <T>(obj: T) => ExtendedResponse;
}

const convertResponse = (res: express.Response): ExtendedResponse => {
	(res as ExtendedResponse).sjson = <T>(obj: T) => convertResponse(res.json(obj));
	return res as ExtendedResponse;
};

export const extraTypes = (func: (req: express.Request, res: ExtendedResponse) => void) => (
	req: express.Request,
	res: express.Response
) => {
	func(req, convertResponse(res));
};

type ExpressHandler<R = any> = (
	req: AccountRequest,
	res: express.Response,
	next: express.NextFunction
) => R;

type FunctionalExpressHandler<R = any> = (req: BasicMySQLRequest) => R;
type ParameterizedFunctionalExpressHandler<R = any, P extends ParamType = {}> = (
	req: BasicMySQLRequest<P>
) => R;

type AsyncExpressHandler<R> = ExpressHandler<Promise<R>>;
type ConvertedAsyncExpressHandler<R> = AsyncExpressHandler<R> & { fn: AsyncExpressHandler<R> };

export const asyncErrorHandler = (
	fn: AsyncExpressHandler<any>
): ConvertedAsyncExpressHandler<any> => {
	const handler: ConvertedAsyncExpressHandler<any> = (req, res, next) =>
		fn(req, res, next).catch(next);

	handler.fn = fn;

	return handler;
};

export const leftyAsyncErrorHandler: typeof asyncErrorHandler = fn => {
	const handler: ConvertedAsyncExpressHandler<any> = (req, res, next) =>
		fn(req, res, next).catch(async err => {
			await saveServerError(err, await convertReqForSavingAsError(req));

			res.status(500);
			res.json(
				left({
					code: 500,
					message: 'Unknown server error'
				})
			);
		});

	handler.fn = fn;

	return handler;
};

export const asyncEitherMiddlewareHandler = <R>(
	fn: EitherExpressHandler<R>
): ConvertedEitherExpressHandler<R> => {
	const handler: ConvertedEitherExpressHandler<R> = (req, res, next) => {
		const result = fn(req);

		((result instanceof Promise
			? result
			: (result as AsyncEither<api.ServerError, EitherResult<R>>).join()) as Promise<
			EitherObj<api.ServerError, R>
		>)
			.then(eith =>
				either(eith).cata(
					async l =>
						l.error.cata(
							() =>
								Promise.resolve(
									res.json(
										left({
											code: l.code,
											message: l.message
										})
									)
								),
							async err => {
								await saveServerError(err, await convertReqForSavingAsError(req));

								return res.json(
									left({
										code: l.code,
										message: l.message
									})
								);
							}
						),
					() => next()
				)
			)
			.catch(async err => {
				if (err instanceof Error) {
					await saveServerError(err, await convertReqForSavingAsError(req));
				}

				res.status(500);
				return res.json(
					left({
						code: 500,
						message: err instanceof Error ? err.message : err
					})
				);
			});
	};

	handler.fn = fn;

	return handler;
};

type EitherResult<E> = E extends EitherObj<any, infer R> ? R : never;

// The complicated conditional type allows for containing EitherObj in the type or a value.
// If it is a value, the handler expects a wrapped EitherObj that would be equivalent to an
// EitherObj
type EitherExpressHandler<R> = FunctionalExpressHandler<
	R extends EitherObj<api.ServerError, infer T>
		? Promise<EitherObj<api.ServerError, T>> | AsyncEither<api.ServerError, T>
		: never
>;
type ConvertedEitherExpressHandler<R> = ExpressHandler & { fn: EitherExpressHandler<R> };

const convertReqForSavingAsError = (
	req: BasicMySQLRequest
): Promise<BasicConditionalMemberRequest> =>
	asyncRight(req, serverErrorGenerator('Could not upgrade request information'))
		.flatMap((r: BasicMySQLRequest | BasicAccountRequest) =>
			'account' in r
				? asyncRight(r, serverErrorGenerator('Could not upgrade account information'))
				: Account.RequestTransformer(r)
		)
		.flatMap((r: BasicAccountRequest | BasicMaybeMemberRequest) =>
			'member' in r
				? asyncRight(r, serverErrorGenerator('Could not upgrade account information'))
				: memberRequestTransformer(true, false)(r)
		)
		.map(r => ({
			...r,
			member: r.member.orNull()
		}))
		.fullJoin();

export const asyncEitherHandler = <R>(
	fn: EitherExpressHandler<R>
): ConvertedEitherExpressHandler<R> => {
	const handler: ConvertedEitherExpressHandler<R> = (req, res) => {
		const result = fn(req);

		((result instanceof Promise
			? result
			: (result as AsyncEither<api.ServerError, EitherResult<R>>).join()) as Promise<
			EitherObj<api.ServerError, R>
		>)
			.then(eith =>
				either(eith).cata(
					async l => {
						return l.error.cata(
							() =>
								Promise.resolve(
									res.json(
										left({
											code: l.code,
											message: l.message
										})
									)
								),
							async err => {
								await saveServerError(
									err,
									await convertReqForSavingAsError(req),
									l
								);

								return res.json(
									left({
										code: l.code,
										message: l.message
									})
								);
							}
						);
					},
					async r => res.json(right(r))
				)
			)
			.catch(async err => {
				if (err instanceof Error) {
					await saveServerError(err, await convertReqForSavingAsError(req));
				}

				res.status(500);
				return res.json(
					left({
						code: 500,
						message: err instanceof Error ? err.message : err
					})
				);
			});
	};

	handler.fn = fn;

	return handler;
};

type ParameterizedEitherExpressHandler<
	R,
	P extends ParamType = {}
> = ParameterizedFunctionalExpressHandler<
	R extends EitherObj<api.ServerError, infer T>
		? Promise<EitherObj<api.ServerError, T>> | AsyncEither<api.ServerError, T>
		: never,
	P
>;
type ParameterizedConvertedEitherExpressHandler<
	R,
	P extends ParamType,
	F extends ParameterizedEitherExpressHandler<R, P>
> = ExpressHandler & {
	fn: F;
};

export const asyncEitherHandler2 = <R, P extends ParamType = {}>(
	fn: ParameterizedEitherExpressHandler<R, P>
): ParameterizedConvertedEitherExpressHandler<R, P, typeof fn> => asyncEitherHandler<R>(fn);

export const serverErrorGenerator = (message: string) => (err: Error): api.ServerError => ({
	code: 500,
	error: just(err),
	message
});

/**
 * Use whenever taking an object and passing it to MySQL
 *
 * MySQL xDevAPI throws cryptic errors when passed undefined instead of null
 * It gives the impression that the developers that made the connector were
 * not used to JavaScript, and didn't get to be comfortable enough when
 * developing the connector
 *
 * @param obj The object to replace
 */
export const replaceUndefinedWithNull = (obj: any) => {
	for (const i in obj) {
		if (obj.hasOwnProperty(i)) {
			if (obj[i] === undefined) {
				obj[i] = null;
			} else if (typeof obj[i] === 'object') {
				replaceUndefinedWithNull(obj[i]);
			}
		}
	}
};

export const replaceUndefinedWithNullMiddleware: express.RequestHandler = (req, res, next) => {
	replaceUndefinedWithNull(req.body);

	next();
};

export type MonthNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export const getTargetMonth = (timestamp: number): MonthNumber => {
	const date = new Date(timestamp);

	return date.getMonth() as MonthNumber;
};

export const getTargetYear = (timestamp: number): number => {
	const date = new Date(timestamp);

	return date.getFullYear();
};

export const presentMultCheckboxReturn = (
	value: MultCheckboxReturn,
	labels: string[],
	other: boolean,
	separator = ', '
) => {
	const arrayValue = labels.filter((label, i) => value[0][i]);
	if (other && value[0][labels.length]) {
		arrayValue.push(value[1]);
	}

	return arrayValue.join(separator);
};

export function formatPhone(phone: string) {
	// strip spaces and non-numeric characters
	phone.trimLeft().trimRight();
	// add 2 dots
	return phone.substring(0, 3) + '.' + phone.substring(3, 6) + '.' + phone.substring(6, 10);
}

export const collectGenerator = async <T>(gen: AsyncIterableIterator<T>): Promise<T[]> => {
	const ret: T[] = [];

	for await (const i of gen) {
		ret.push(i);
	}

	return ret;
};

/*
str = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It w as popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

str = wordWrap(str, 40);

function commentsBlock(str, maxWidth) {
    var newLineStr = "\n"; done = false; res = '';
    while (str.length > maxWidth) {                 
        found = false;
        // Inserts new line at first whitespace of the line
        for (i = maxWidth - 1; i >= 0; i--) {
            if (testWhite(str.charAt(i))) {
                res = res + [str.slice(0, i), newLineStr].join('');
                str = str.slice(i + 1);
                found = true;
                break;
            }
        }
        // Inserts new line at maxWidth position, the word is too long to wrap
        if (!found) {
            res += [str.slice(0, maxWidth), newLineStr].join('');
            str = str.slice(maxWidth);
        }

    }

    return res + str;
}

function testWhite(x) {
    var white = new RegExp(/^\s$/);
    return white.test(x.charAt(0));
};
*/
