import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncRight,
	canManageEvent,
	errorGenerator,
	Maybe,
	Permissions,
	SessionType,
	toReference,
} from 'common-lib';
import { copyEvent, getEvent, getFullEventObject, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.events.events.Copy> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	asyncRight(req, errorGenerator('Could not get information')).flatMap(() =>
		getEvent(req.mysqlx)(req.account)(req.params.id)
			.filter(canManageEvent(Permissions.ManageEvent.FULL)(req.member), {
				type: 'OTHER',
				code: 403,
				message: 'Member does not have permission to perform that action',
			})
			.map(copyEvent(req.configuration)(req.mysqlx)(req.account))
			.map(copier => copier(toReference(req.member)))
			.map(copier => copier(req.body.newTime))
			.map(copier => copier(!!req.body.copyStatus))
			.flatMap(copier => copier(!!req.body.copyFiles))
			.flatMap(getFullEventObject(req.mysqlx)(req.account)(Maybe.some(req.member)))
	)
);

export default func;
