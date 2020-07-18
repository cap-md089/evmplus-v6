import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncRight,
	effectiveManageEventPermission,
	errorGenerator,
	EventStatus,
	Maybe,
	Permissions,
	SessionType,
} from 'common-lib';
import { createEventFunc, getFullEventObject, PAM } from 'server-common';

export const func: (now?: () => number) => ServerAPIEndpoint<api.events.events.Add> = (
	now = Date.now
) =>
	PAM.RequireSessionType(SessionType.REGULAR)(request =>
		asyncRight(request, errorGenerator('Could not create event'))
			.filter(req => effectiveManageEventPermission(req.member) !== 0, {
				type: 'OTHER',
				code: 403,
				message: 'You do not have permission to do that',
			})
			.map(req => ({
				...req,
				body: {
					...req.body,
					status:
						effectiveManageEventPermission(req.member) ===
						Permissions.ManageEvent.ADDDRAFTEVENTS
							? EventStatus.DRAFT
							: req.body.status,
				},
			}))
			.flatMap(req =>
				createEventFunc(now)(req.configuration)(req.mysqlx)(req.account)(req.member)(
					req.body
				)
			)
			.flatMap(
				getFullEventObject(request.mysqlx)(request.account)(Maybe.some(request.member))
			)
	);

export default func();
