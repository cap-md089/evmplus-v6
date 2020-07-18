import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncIterFilter,
	asyncIterMap,
	call,
	Either,
	EitherObj,
	FullTeamObject,
	get,
	isPartOfTeam,
	Maybe,
	MaybeObj,
	pipe,
	RawTeamObject,
	Right,
	ServerError,
	SessionType,
	TeamPublicity,
	User,
} from 'common-lib';
import { expandTeam, getTeamObjects, httpStripTeamObject, PAM } from 'server-common';

const isTeamMemberOrLeaderIfPrivate = (user: MaybeObj<User>) => (team: FullTeamObject) =>
	team.visibility === TeamPublicity.PRIVATE
		? pipe(
				Maybe.map<User, (team: RawTeamObject) => boolean>(isPartOfTeam),
				Maybe.map<(team: RawTeamObject) => boolean, boolean>(call(team)),
				Maybe.orSome(false)
		  )(user)
		: true;

export const func: ServerAPIEndpoint<api.team.ListTeams> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getTeamObjects(req.mysqlx)(req.account)
		.map(asyncIterMap(expandTeam(req.mysqlx)(req.account)))
		.map(
			asyncIterFilter<EitherObj<ServerError, FullTeamObject>, Right<FullTeamObject>>(
				Either.isRight
			)
		)
		.map(asyncIterMap<Right<FullTeamObject>, FullTeamObject>(get('value')))
		.map(asyncIterFilter(isTeamMemberOrLeaderIfPrivate(req.member)))
		.map(asyncIterMap(httpStripTeamObject(req.member)))
);

export default func;
