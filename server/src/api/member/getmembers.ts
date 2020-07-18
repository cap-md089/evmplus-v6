import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	Either,
	EitherObj,
	errorGenerator,
	get,
	Member,
	Right,
	ServerError,
	SessionType,
} from 'common-lib';
import { getMembers, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.member.Members> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	asyncRight(getMembers(req.mysqlx)(req.account), errorGenerator('Could not get members'))
		.map(asyncIterFilter<EitherObj<ServerError, Member>, Right<Member>>(Either.isRight))
		.map(asyncIterMap(get('value')))
);

export default func;
