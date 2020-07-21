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

import { Schema } from '@mysql/xdevapi';
import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncRight,
	errorGenerator,
	ErrorResolvedStatus,
	Errors,
	SessionType,
} from 'common-lib';
import { findAndBindC, generateResults, isRequesterRioux, PAM } from 'server-common';

export const getErrors = (schema: Schema) =>
	asyncRight(
		schema.getCollection<Errors>('Errors'),
		errorGenerator('Could not get error objects')
	)
		.map(
			findAndBindC<Errors>({ resolved: ErrorResolvedStatus.UNRESOLVED })
		)
		.map(generateResults);

export const func: ServerAPIEndpoint<api.errors.GetErrors> = PAM.RequireSessionType(
	SessionType.REGULAR
)(request =>
	asyncRight(request, errorGenerator('Could not get error list'))
		.filter(isRequesterRioux, {
			type: 'OTHER',
			code: 403,
			message: 'Member does not have the required permissions',
		})
		.flatMap(req => getErrors(req.mysqlx))
);

export default func;
