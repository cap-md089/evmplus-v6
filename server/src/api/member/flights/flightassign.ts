import { ServerAPIEndpoint } from 'auto-client-api';
import { api, asyncEither, destroy, errorGenerator, SessionType } from 'common-lib';
import { PAM, resolveReference, saveExtraMemberInformation } from 'server-common';
import { getExtraMemberInformationForCAPMember } from 'server-common/dist/member/members/cap';

export const func: ServerAPIEndpoint<api.member.flight.Assign> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('FlightAssign')(req =>
		resolveReference(req.mysqlx)(req.account)(req.body.member)
			.map(member => ({
				...member,
				flight: req.body.flight,
			}))
			.flatMap(member =>
				asyncEither(
					getExtraMemberInformationForCAPMember(req.account)(member),
					errorGenerator('Could not save flight information')
				)
					.flatMap(saveExtraMemberInformation(req.mysqlx)(req.account))
					.tap(() =>
						req.memberUpdateEmitter.emit('memberChange', {
							member,
							account: req.account,
						})
					)
					.map(destroy)
			)
	)
);

export default func;
