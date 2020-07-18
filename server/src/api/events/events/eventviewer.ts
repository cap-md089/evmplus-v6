import {
	AsyncRepr,
	ServerAPIEndpoint,
	ServerAPIRequestParameter,
	ServerEither,
} from 'auto-client-api';
import {
	always,
	api,
	AsyncEither,
	asyncIterMap,
	asyncRight,
	AttendanceRecord,
	canMaybeManageEvent,
	Either,
	errorGenerator,
	Maybe,
	memoize,
	Permissions,
	RawEventObject,
} from 'common-lib';
import {
	getAccount,
	getAttendanceForEvent,
	getCAPAccountsForORGID,
	getEvent,
	getFullPointsOfContact,
	getOrgName,
	getRegistry,
	resolveReference,
} from 'server-common';

export const getFullEventInformation = (
	req: ServerAPIRequestParameter<api.events.events.GetEventViewerData>
) => (event: RawEventObject): ServerEither<AsyncRepr<api.events.events.EventViewerData>> =>
	AsyncEither.All([
		asyncRight(
			getOrgName({
				byId: always(memoize(getAccount(req.mysqlx))),
				byOrgid: always(memoize(getCAPAccountsForORGID(req.mysqlx))),
			})(req.mysqlx)(req.account),
			errorGenerator('Could not get stuff')
		).flatMap(orgNameGetter =>
			getAttendanceForEvent(req.mysqlx)(event).map(
				asyncIterMap(record =>
					resolveReference(req.mysqlx)(req.account)(record.memberID)
						.flatMap(member =>
							orgNameGetter(member).map(orgName => ({
								member: Maybe.some(member),
								record,
								orgName,
							}))
						)
						.leftFlatMap(
							always(
								Either.right({
									member: Maybe.none(),
									record,
									orgName: Maybe.none(),
								})
							)
						)
				)
			)
		),
		getFullPointsOfContact(req.mysqlx)(req.account)(event.pointsOfContact),
	]).map<AsyncRepr<api.events.events.EventViewerData>>(([attendees, pointsOfContact]) => ({
		event,
		attendees,
		pointsOfContact,
	}));

export const func: ServerAPIEndpoint<api.events.events.GetEventViewerData> = req =>
	getEvent(req.mysqlx)(req.account)(req.params.id).flatMap(event =>
		canMaybeManageEvent(Permissions.ManageEvent.FULL)(req.member)
			? getFullEventInformation(req)(event)
			: AsyncEither.All([
					getRegistry(req.mysqlx)(req.account),
					getAttendanceForEvent(req.mysqlx)(event),
					getFullPointsOfContact(req.mysqlx)(req.account)(
						event.pointsOfContact.map(poc => ({
							...poc,
							email: !!poc.publicDisplay || Maybe.isSome(req.member) ? poc.email : '',
							phone: !!poc.publicDisplay || Maybe.isSome(req.member) ? poc.phone : '',
						}))
					),
			  ]).map<AsyncRepr<api.events.events.EventViewerData>>(
					([registry, attendees, pointsOfContact]) => ({
						event,
						attendees:
							event.privateAttendance &&
							!canMaybeManageEvent(Permissions.ManageEvent.FULL)(req.member)(event)
								? []
								: asyncIterMap((record: AttendanceRecord) =>
										Either.right({
											member: Maybe.none(),
											record,
											orgName: Maybe.some(registry.Website.Name),
										})
								  )(attendees),
						pointsOfContact,
					})
			  )
	);

export default func;
