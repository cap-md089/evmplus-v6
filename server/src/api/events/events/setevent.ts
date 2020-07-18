import { ServerAPIEndpoint, validator } from 'auto-client-api';
import {
	always,
	api,
	canManageEvent,
	Maybe,
	NewEventObject,
	Permissions,
	RawEventObject,
	SessionType,
	Validator,
} from 'common-lib';
import { getEvent, getFullEventObject, PAM, saveEventFunc } from 'server-common';
import { validateRequest } from '../../../lib/requestUtils';

const partialEventValidator = Validator.Partial(
	(validator<NewEventObject>(Validator) as Validator<NewEventObject>).rules
);

export const func: (now?: () => number) => ServerAPIEndpoint<api.events.events.Set> = (
	now = Date.now
) =>
	PAM.RequireSessionType(SessionType.REGULAR)(request =>
		validateRequest(partialEventValidator)(request).flatMap(req =>
			getEvent(req.mysqlx)(req.account)(req.params.id)
				.filter(canManageEvent(Permissions.ManageEvent.ADDDRAFTEVENTS)(req.member), {
					type: 'OTHER',
					code: 403,
					message: 'Member does not have permission to perform that action',
				})
				.map<[RawEventObject, RawEventObject]>(event => [
					{
						...event,
						...req.body,
						status: canManageEvent(Permissions.ManageEvent.FULL)(req.member)(event)
							? req.body.status ?? event.status
							: event.status,
					},
					event,
				])
				.tap(([newEvent, oldEvent]) => {
					console.log(newEvent);
				})
				.flatMap(([newEvent, oldEvent]) =>
					saveEventFunc(now)(req.configuration)(req.mysqlx)(req.account)(oldEvent)(
						newEvent
					).map(always(newEvent))
				)
				.flatMap(getFullEventObject(req.mysqlx)(req.account)(Maybe.some(req.member)))
		)
	);

export default func();
