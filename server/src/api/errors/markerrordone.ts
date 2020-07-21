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
	areErrorObjectsTheSame,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	collectGeneratorAsync,
	destroy,
	errorGenerator,
	ErrorResolvedStatus,
	Errors,
	get,
	SessionType,
} from 'common-lib';
import { isRequesterRioux, PAM } from 'server-common';
import { getErrors } from './geterrors';

const errorHandler = errorGenerator('Could not mark error as resolved');

export const func: ServerAPIEndpoint<api.errors.MarkErrorAsDone> = PAM.RequireSessionType(
	SessionType.REGULAR
)(request =>
	asyncRight(request, errorHandler)
		.filter(isRequesterRioux, {
			type: 'OTHER',
			code: 403,
			message: 'Member is not a developer',
		})
		.flatMap(req =>
			asyncRight(
				({
					type: req.body.type,
					message: req.body.message,
					stack: [
						{
							column: req.body.column,
							line: req.body.line,
							filename: req.body.fileName,
						},
					],
				} as unknown) as Errors,
				errorHandler
			)
				.flatMap(err =>
					getErrors(req.mysqlx)
						.map(asyncIterFilter(areErrorObjectsTheSame(err)))
						.map(asyncIterMap(get('id')))
				)
				.map(collectGeneratorAsync)
				.map(errorIDs =>
					req.mysqlx
						.getCollection<Errors>('Errors')
						.modify(`id in [${errorIDs.join(',')}]`)
						.patch({
							resolved: ErrorResolvedStatus.RESOLVED,
						})
						.execute()
				)
				.map(destroy)
		)
);

export default func;
