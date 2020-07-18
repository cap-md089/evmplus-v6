import { ServerAPIEndpoint } from 'auto-client-api';
import { always, api, get, RawEventObject, SessionType, toReference } from 'common-lib';
import { getEvent, PAM, saveEventFunc } from 'server-common';

export const func: (now?: () => number) => ServerAPIEndpoint<api.events.debrief.Add> = (
	now = Date.now
) =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		getEvent(req.mysqlx)(req.account)(req.params.id)
			.map<[RawEventObject, RawEventObject]>(oldEvent => [
				oldEvent,
				{
					...oldEvent,
					debrief: [
						...oldEvent.debrief,
						{
							debriefText: req.body.debriefText,
							memberRef: toReference(req.member),
							timeSubmitted: now(),
						},
					],
				},
			])
			.flatMap(([oldEvent, newEvent]) =>
				saveEventFunc(now)(req.configuration)(req.mysqlx)(req.account)(oldEvent)(
					newEvent
				).map(always(newEvent))
			)
			.map(get('debrief'))
	);

export default func();
