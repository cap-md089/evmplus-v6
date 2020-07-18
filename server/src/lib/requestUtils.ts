import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	asyncEither,
	BasicMySQLRequest,
	Either,
	errorGenerator,
	ValidatorError,
	ValidatorFail,
	ValidatorImpl,
} from 'common-lib';
import { BasicAccountRequest, ServerEither } from 'server-common';

interface InputFunctions<Arg> {
	[key: string]: (arg: Arg) => any;
}

type ReqWithFunctions<
	Req extends BasicMySQLRequest<any>,
	Arg extends any,
	Funcs extends InputFunctions<Arg>
> = Omit<Req, keyof Funcs> &
	{
		[P in keyof Funcs]: ReturnType<Funcs[P]>;
	};

export const schemaApply = <T extends InputFunctions<Schema>, R extends BasicMySQLRequest>(
	funcs: T
) => (req: R): ReqWithFunctions<R, Schema, T> => {
	const newReq = {
		...req,
	} as ReqWithFunctions<R, Schema, T>;

	for (const func in funcs) {
		if (funcs.hasOwnProperty(func)) {
			newReq[func] = funcs[func](req.mysqlx);
		}
	}

	return newReq;
};

export const accountApply = <
	T extends InputFunctions<AccountObject>,
	R extends BasicAccountRequest
>(
	funcs: T
) => (req: R): ReqWithFunctions<R, AccountObject, T> => {
	const newReq = {
		...req,
	} as ReqWithFunctions<R, AccountObject, T>;

	for (const func in funcs) {
		if (funcs.hasOwnProperty(func)) {
			newReq[func] = funcs[func](req.account);
		}
	}

	return newReq;
};

export const validateRequest = <T extends any>(validator: ValidatorImpl<T>) => <
	R extends { body: unknown }
>(
	req: R
): ServerEither<Omit<R, 'body'> & { body: T }> =>
	asyncEither(
		Either.leftMap<ValidatorFail, ValidatorError, T>(validatorState => ({
			type: 'VALIDATOR',
			code: 400,
			message: 'There was a problem with the request',
			validatorState,
		}))(validator.validate(req.body, 'body')),
		errorGenerator('Could not validate body')
	).map<Omit<R, 'body'> & { body: T }>(body => ({ ...req, body }));
