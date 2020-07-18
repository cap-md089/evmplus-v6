import { ServerAPIEndpoint } from 'auto-client-api';
import { api, asyncEither, destroy, errorGenerator, SessionType } from 'common-lib';
import { CAP, PAM, saveExtraMemberInformation } from 'server-common';

export const func: ServerAPIEndpoint<api.member.SetAbsenteeInformation> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	asyncEither(
		CAP.getExtraMemberInformationForCAPMember(req.account)(req.member),
		errorGenerator('Could not save extra member information')
	)
		.flatMap(saveExtraMemberInformation(req.mysqlx)(req.account))
		.map(destroy)
);

export default func;
