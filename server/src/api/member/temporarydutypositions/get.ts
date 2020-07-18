import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncEither,
	collectGenerator,
	errorGenerator,
	get,
	iterFilter,
	parseStringMemberReference,
	SessionType,
	ShortCAPUnitDutyPosition,
	ShortDutyPosition,
} from 'common-lib';
import { PAM, resolveReference } from 'server-common';

export const func: ServerAPIEndpoint<api.member.temporarydutypositions.GetTemporaryDutyPositions> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	asyncEither(
		parseStringMemberReference(req.params.id),
		errorGenerator('Could not get member information')
	)
		.flatMap(resolveReference(req.mysqlx)(req.account))
		.map(get('dutyPositions'))
		.map(
			iterFilter<ShortDutyPosition, ShortCAPUnitDutyPosition>(
				(dutyPosition): dutyPosition is ShortCAPUnitDutyPosition =>
					dutyPosition.type === 'CAPUnit'
			)
		)
		.map(collectGenerator)
);

export default func;
