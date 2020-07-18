import { ServerAPIEndpoint } from 'auto-client-api';
import {
	always,
	api,
	asyncIterFilter,
	asyncIterHandler,
	asyncIterMap,
	asyncLeft,
	asyncRight,
	Either,
	EitherObj,
	errorGenerator,
	get,
	hasOneDutyPosition,
	isRioux,
	Member,
	Right,
	ServerError,
	SessionType,
} from 'common-lib';
import { getMembers, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.member.flight.FlightMembersFull> = PAM.RequiresMemberType(
	'CAPNHQMember',
	'CAPProspectiveMember'
)(
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		(hasOneDutyPosition([
			'Cadet Flight Commander',
			'Cadet Flight Sergeant',
			'Cadet Commander',
			'Cadet Deputy Commander',
		])
			? asyncRight(req, errorGenerator('Could not process request'))
			: asyncLeft<ServerError, typeof req>({
					type: 'OTHER',
					code: 403,
					message: 'Member does not have permission to do that',
			  })
		)
			.map(() => getMembers(req.mysqlx)(req.account))
			.map(asyncIterFilter<EitherObj<ServerError, Member>, Right<Member>>(Either.isRight))
			.map(asyncIterMap(get('value')))
			.map(asyncIterFilter(mem => !mem.seniorMember))
			.map(
				asyncIterFilter(
					isRioux(req.member)
						? always(true)
						: hasOneDutyPosition(['Cadet Flight Commander', 'Cadet Flight Sergeant'])(
								req.member
						  )
						? mem => mem.flight === req.member.flight && mem.flight !== null
						: always(true)
				)
			)
			.map(asyncIterHandler(errorGenerator('Could not get member ID')))
	)
);

export default func;
