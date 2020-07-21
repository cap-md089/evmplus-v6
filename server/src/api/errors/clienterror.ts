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

import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncRight,
	ClientErrorObject,
	destroy,
	errorGenerator,
	ErrorResolvedStatus,
	Errors,
	Maybe,
	Member,
	MemberReference,
	pipe,
	toReference,
} from 'common-lib';
import { addToCollection, collectResults } from 'server-common';

export const func: ServerAPIEndpoint<api.errors.ClientError> = req =>
	asyncRight(req.mysqlx.getCollection<Errors>('Errors'), errorGenerator('Could not get new ID'))
		.map(collection => collection.find('true').sort('id DESC').limit(1))
		.map(collectResults)
		.map(Maybe.fromArray)
		.map(Maybe.map<{ id: number }, number>(i => i.id + 1))
		.map(Maybe.orSome(1))
		.map<ClientErrorObject>(id => ({
			accountID: req.account.id,
			componentStack: req.body.componentStack,
			id,
			message: req.body.message,
			pageURL: req.body.pageURL,
			resolved: ErrorResolvedStatus.UNRESOLVED,
			stack: req.body.stack.map(item => ({
				name: item.name,
				filename: item.filename,
				line: item.line,
				column: item.column,
			})),
			timestamp: Date.now(),
			type: 'Client',
			user: pipe(
				Maybe.map<Member, MemberReference>(toReference),
				Maybe.orSome<MemberReference | null>(null)
			)(req.member),
		}))
		.map(addToCollection(req.mysqlx.getCollection<Errors>('Errors')))

		.map(destroy);

export default func;
