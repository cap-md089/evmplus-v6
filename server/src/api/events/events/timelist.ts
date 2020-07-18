import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	canManageEvent,
	Either,
	EitherObj,
	errorGenerator,
	EventStatus,
	get,
	Maybe,
	MaybeObj,
	Permissions,
	pipe,
	RawEventObject,
	Right,
	ServerError,
	User,
} from 'common-lib';
import { getEventsInRange } from 'server-common';

const canMaybeManageEvent = (event: RawEventObject) => (member: MaybeObj<User>) =>
	pipe(
		Maybe.map<User, (e: RawEventObject) => boolean>(
			canManageEvent(Permissions.ManageEvent.ADDDRAFTEVENTS)
		),
		Maybe.orSome<(e: RawEventObject) => boolean>(() => false)
	)(member)(event);

export const func: ServerAPIEndpoint<api.events.events.GetRange> = req =>
	asyncRight(
		[parseInt(req.params.timestart, 10), parseInt(req.params.timeend, 10)],
		errorGenerator('Could not get events in range')
	)
		.filter(([timestart, timeend]) => !isNaN(timestart) && !isNaN(timeend), {
			type: 'OTHER',
			code: 400,
			message: 'The provided range start and end are invalid',
		})
		.map(([timestart, timeend]) =>
			getEventsInRange(req.mysqlx)(req.account)(timestart)(timeend)
		)
		.map(
			asyncIterFilter<EitherObj<ServerError, RawEventObject>, Right<RawEventObject>>(
				Either.isRight
			)
		)
		.map(asyncIterMap(get('value')))
		.map(
			asyncIterFilter(
				event =>
					event.status !== EventStatus.DRAFT || canMaybeManageEvent(event)(req.member)
			)
		);

export default func;
