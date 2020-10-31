/**
 * Copyright (C) 2020 Andrew Rioux
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

import {
	AccountObject,
	always,
	BasicMySQLRequest,
	Either,
	EitherObj,
	Errors,
	get,
	HTTPRequestMethod,
	Maybe,
	Member,
	MemberReference,
	ParamType,
	ServerError,
	ServerErrorObject,
	toReference,
} from 'common-lib';
import { parse } from 'error-stack-parser';
import {
	accountRequestTransformer,
	BasicAccountRequest,
	generateResults,
	PAM,
} from 'server-common';

export type Requests<P extends ParamType = {}, B = any> =
	| BasicMySQLRequest<P, B>
	| BasicAccountRequest<P, B>
	| PAM.BasicMemberRequest<P, B>
	| PAM.BasicMaybeMemberRequest<P, B>;

export default async (err: Error, req: Requests, l?: ServerError) => {
	if (err.message.startsWith('Not allowed by CORS')) {
		return;
	}

	console.error(err);

	const errorCollection = req.mysqlx.getCollection<Errors>('Errors');
	try {
		let id = 0;
		// Create the ID of the new error
		{
			const errorGenerator = generateResults(errorCollection.find('true'));

			for await (const error of errorGenerator) {
				id = Math.max(id, error.id);
			}

			id++;
		}

		let account: EitherObj<ServerError, AccountObject>;

		{
			if ('account' in req) {
				account = Either.right(req.account);
			} else {
				account = await accountRequestTransformer(req).map(get('account')).join();
			}
		}

		// Add the error to the database
		{
			const stacks = parse(err);

			const errorObject: ServerErrorObject = {
				id,

				requestedPath: req._originalUrl,
				requestedUser:
					'member' in req
						? 'hasValue' in req.member
							? Maybe.orSome<MemberReference | null>(null)(
									Maybe.map<Member, MemberReference | null>(toReference)(
										req.member,
									),
							  )
							: toReference(req.member)
						: null,
				requestMethod: req.method.toUpperCase() as HTTPRequestMethod,
				payload: !!req.body ? JSON.stringify(req.body) : '<none>',
				accountID: Either.cata<ServerError, AccountObject, string>(always('<unknown>'))(
					get('id'),
				)(account),

				message: err.message || '<none>',
				stack: stacks.map(stack => ({
					filename: stack.getFileName(),
					line: stack.getLineNumber(),
					column: stack.getColumnNumber(),
					name: stack.getFunctionName() || '<unknown>',
				})),
				filename: stacks[0].getFileName(),

				timestamp: Date.now(),
				type: 'Server',
			};

			try {
				await errorCollection.add(errorObject).execute();
			} catch (e) {
				console.log('Could not record error!', e);
			}
		}
	} catch (err) {
		// Wrapped in a try-catch because it is crucial this doesn't fail, similar to C++'s noexcept
		console.error('Additionally, another error occurred while trying to save the error', err);
	}
};
