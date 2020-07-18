import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	CAPExtraMemberInformation,
	collectGeneratorAsync,
	destroy,
	Either,
	EitherObj,
	errorGenerator,
	get,
	Member,
	MemberReference,
	Right,
	ServerError,
	SessionType,
} from 'common-lib';
import { PAM, resolveReference, saveExtraMemberInformation } from 'server-common';
import { getExtraMemberInformationForCAPMember } from 'server-common/dist/member/members/cap';

export const func: ServerAPIEndpoint<api.member.flight.AssignBulk> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('FlightAssign')(req =>
		asyncRight(req.body.members, errorGenerator('Could not update member information'))
			.map(
				asyncIterMap<
					{ newFlight: string | null; member: MemberReference },
					EitherObj<ServerError, { newFlight: string | null; member: Member }>
				>(info =>
					resolveReference(req.mysqlx)(req.account)(info.member).map(member => ({
						member,
						newFlight: info.newFlight,
					}))
				)
			)
			.map(
				asyncIterFilter<
					EitherObj<ServerError, { newFlight: string | null; member: Member }>,
					Right<{ newFlight: string | null; member: Member }>
				>(Either.isRight)
			)
			.map(asyncIterMap(get('value')))
			.map(asyncIterFilter(info => info.newFlight !== info.member.flight))
			.map(
				asyncIterMap(info => ({
					...info.member,
					flight: info.newFlight,
				}))
			)
			.map(asyncIterMap(getExtraMemberInformationForCAPMember(req.account)))
			.map(
				asyncIterFilter<
					EitherObj<ServerError, CAPExtraMemberInformation>,
					Right<CAPExtraMemberInformation>
				>(Either.isRight)
			)
			.map(asyncIterMap(get('value')))
			.map(asyncIterMap(saveExtraMemberInformation(req.mysqlx)(req.account)))
			.map(collectGeneratorAsync)
			.map(destroy)
	)
);

export default func;
