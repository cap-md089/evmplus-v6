import { pipe } from 'ramda';
import {
	MemberReference,
	NewTeamMember,
	NewTeamObject,
	RawTeamMember,
	RawTeamObject,
	TeamPublicity,
} from '../typings/types';
import { Maybe, MaybeObj } from './Maybe';
import { areMembersTheSame } from './Member';
import { call, get } from './Util';

export const isPartOfTeam = (member: MemberReference) => {
	const checker = areMembersTheSame(member);

	const leaderChecker = pipe(Maybe.map(checker), Maybe.orSome(false));

	return (team: NewTeamObject | RawTeamObject) =>
		leaderChecker(team.seniorCoach) ||
		leaderChecker(team.seniorMentor) ||
		leaderChecker(team.cadetLeader) ||
		(team.members as Array<NewTeamMember | RawTeamMember>)
			.map(get('reference'))
			.some(areMembersTheSame(member));
};

export const isTeamLeader = (member: MemberReference) => {
	const checker = areMembersTheSame(member);

	const leaderChecker = pipe(Maybe.map(checker), Maybe.orSome(false));

	return (team: NewTeamObject | RawTeamObject) =>
		leaderChecker(team.cadetLeader) ||
		leaderChecker(team.seniorCoach) ||
		leaderChecker(team.seniorMentor);
};

export const canSeeMembership = (member: MaybeObj<MemberReference>) => {
	const isPartOfTeamChecker = (team: NewTeamObject) =>
		pipe(
			Maybe.map<MemberReference, (team: NewTeamObject) => boolean>(isPartOfTeam),
			Maybe.map(call(team)),
			Maybe.orSome(false)
		)(member);

	return (team: NewTeamObject | RawTeamObject) =>
		team.visibility === TeamPublicity.PRIVATE
			? isPartOfTeamChecker(team)
			: team.visibility === TeamPublicity.PROTECTED
			? member.hasValue
			: true;
};
