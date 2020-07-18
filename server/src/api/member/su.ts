import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	api,
	asyncLeft,
	asyncRight,
	destroy,
	errorGenerator,
	isRioux,
	ServerError,
	SessionType,
} from 'common-lib';
import { PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.member.Su> = PAM.RequireSessionType(SessionType.REGULAR)(
	request =>
		asyncRight(request, errorGenerator('Could not su as other user'))
			.flatMap(req =>
				isRioux(req.member)
					? asyncRight<ServerError, ServerAPIRequestParameter<api.member.Su>>(
							req,
							errorGenerator('Could not su as other user')
					  )
					: asyncLeft<ServerError, ServerAPIRequestParameter<api.member.Su>>({
							type: 'OTHER',
							code: 403,
							message: "You don't have permission to do that",
					  })
			)
			.map(req => PAM.su(req.mysqlx, req.session, req.body))
			.map(destroy)
);

export default func;
