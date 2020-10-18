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

import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	api,
	asyncLeft,
	asyncRight,
	destroy,
	errorGenerator,
	isRioux,
	ServerError,
	SessionType,
} from 'common-lib';
import { PAM } from 'server-common';
import wrapper from '../../../lib/wrapper';

export const func: ServerAPIEndpoint<api.member.session.Su> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(request =>
	asyncRight(request, errorGenerator('Could not su as other user'))
		.flatMap(req =>
			isRioux(req.member)
				? asyncRight<ServerError, ServerAPIRequestParameter<api.member.session.Su>>(
						req,
						errorGenerator('Could not su as other user'),
				  )
				: asyncLeft<ServerError, ServerAPIRequestParameter<api.member.session.Su>>({
						type: 'OTHER',
						code: 403,
						message: "You don't have permission to do that",
				  }),
		)
		.map(req => PAM.su(req.mysqlx, req.session, req.body))
		.map(destroy)
		.map(wrapper),
);

export default func;
