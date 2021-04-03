/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Collection, Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	AccountType,
	areMembersTheSame,
	AsyncEither,
	asyncLeft,
	asyncRight,
	errorGenerator,
	FullPreviousTeamMember,
	FullTeamMember,
	FullTeamObject,
	get,
	getItemsNotInSecondArray,
	isPartOfTeam,
	isTeamLeader,
	Maybe,
	MaybeObj,
	MemberReference,
	MemberUpdateEventEmitter,
	memoize,
	NewTeamMember,
	NewTeamObject,
	NHQ,
	pipe,
	RawCAPSquadronAccountObject,
	RawPreviousTeamMember,
	RawTeamMember,
	RawTeamObject,
	ServerError,
	set,
	TeamPublicity,
	User,
} from 'common-lib';
import { DateTime } from 'luxon';
import { getMemberName } from './Members';
import {
	addToCollection,
	collectResults,
	deleteFromCollectionA,
	findAndBind,
	findAndBindC,
	generateResults,
	getNewID,
	MySQLRequest,
	saveToCollectionA,
} from './MySQLUtil';
import { ServerEither } from './servertypes';

// TODO: Simplify
export const getStaffTeam = (schema: Schema) => (
	account: RawCAPSquadronAccountObject,
): ServerEither<RawTeamObject> =>
	asyncRight(
		(async () => {
			const cadetDutyPositions = schema.getCollection<NHQ.CadetDutyPosition>(
				'NHQ_CadetDutyPosition',
			);
			const dutyPositions = schema.getCollection<NHQ.DutyPosition>('NHQ_DutyPosition');

			const teamObject: RawTeamObject = {
				accountID: account.id,
				cadetLeader: Maybe.none(),
				description: 'Cadet Staff',
				id: 0,
				members: [],
				name: 'Cadet Staff',
				seniorCoach: Maybe.none(),
				seniorMentor: Maybe.none(),
				teamHistory: [],
				visibility: TeamPublicity.PROTECTED,
			};

			const cadetGenerators = [];

			for (const ORGID of account.orgIDs) {
				cadetGenerators.push(
					generateResults(
						findAndBind(cadetDutyPositions, {
							ORGID,
						}),
					),
				);
			}

			const cadets: {
				[key: number]: {
					positions: string[];
					joined: number;
				};
			} = {};

			for (const generator of cadetGenerators) {
				for await (const cadetDutyPosition of generator) {
					if (cadetDutyPosition.Duty === 'Cadet Commander') {
						teamObject.cadetLeader = Maybe.some({
							type: 'CAPNHQMember',
							id: cadetDutyPosition.CAPID,
						});
					}

					if (!cadets[cadetDutyPosition.CAPID]) {
						cadets[cadetDutyPosition.CAPID] = {
							positions: [cadetDutyPosition.Duty],
							joined: +DateTime.fromISO(cadetDutyPosition.DateMod),
						};
					} else {
						const cadet = cadets[cadetDutyPosition.CAPID];

						cadet.positions.push(cadetDutyPosition.Duty);
						cadet.joined = Math.min(
							cadet.joined,
							+DateTime.fromISO(cadetDutyPosition.DateMod),
						);
					}
				}
			}

			for (const cadet in cadets) {
				if (cadets.hasOwnProperty(cadet)) {
					teamObject.members.push({
						job: cadets[cadet].positions.join(', '),
						joined: cadets[cadet].joined,
						reference: {
							type: 'CAPNHQMember',
							id: parseInt(cadet, 10),
						},
					});
				}
			}

			const deputyCommanderDutyPositionGenerator = generateResults(
				findAndBind(dutyPositions, {
					Duty: 'Deputy Commander for Cadets',
					ORGID: account.mainOrg,
				}),
			);

			for await (const senior of deputyCommanderDutyPositionGenerator) {
				if (senior.Asst === 0) {
					teamObject.seniorMentor = Maybe.some({
						type: 'CAPNHQMember',
						id: senior.CAPID,
					});
				}
			}

			return teamObject;
		})(),
		errorGenerator('Could not get cadet staff team'),
	);

export const getTeam = (schema: Schema) => (account: AccountObject) => (
	teamID: number,
): ServerEither<RawTeamObject> =>
	asyncRight(parseInt(teamID + '', 10), errorGenerator('Could not get team information'))
		.filter(num => !isNaN(num), {
			type: 'OTHER',
			code: 400,
			message: 'Invalid Team ID provided',
		})
		.flatMap(id =>
			id === 0 && account.type === AccountType.CAPSQUADRON
				? getStaffTeam(schema)(account)
				: id === 0
				? asyncLeft({
						type: 'OTHER',
						code: 404,
						message: 'Cannot get team',
				  })
				: asyncRight(
						schema.getCollection<RawTeamObject>('Teams'),
						errorGenerator('Could not get team information'),
				  )
						.map(
							findAndBindC<RawTeamObject>({
								id,
								accountID: account.id,
							}),
						)
						.map(collectResults)
						.filter(results => results.length === 1, {
							type: 'OTHER',
							code: 404,
							message: 'Cannot get team',
						})
						.map(get(0)),
		);

const maybeGetTeamLeaderName = (schema: Schema) => (account: AccountObject) => (
	maybeReference: MaybeObj<MemberReference>,
): ServerEither<MaybeObj<string>> =>
	Maybe.cata<MemberReference, ServerEither<MaybeObj<string>>>(() =>
		asyncRight(Maybe.none(), errorGenerator('Could not get member name')),
	)(memberReference => getMemberName(schema)(account)(memberReference).map(Maybe.some))(
		maybeReference,
	);

function getTeamMemberName(
	schema: Schema,
): (
	account: AccountObject,
) => (teamMember: RawPreviousTeamMember) => ServerEither<FullPreviousTeamMember>;
function getTeamMemberName(schema: Schema) {
	return (account: AccountObject) => (teamMember: RawTeamMember): ServerEither<FullTeamMember> =>
		getMemberName(schema)(account)(teamMember.reference).map(name => ({
			...teamMember,
			name,
		}));
}

export const expandTeam = (schema: Schema) => (account: AccountObject) => (
	rawTeam: RawTeamObject,
): ServerEither<FullTeamObject> => {
	const leaderNameGetter = maybeGetTeamLeaderName(schema)(account);
	const memberNameGetter = getTeamMemberName(schema)(account);

	return AsyncEither.All([
		leaderNameGetter(rawTeam.cadetLeader),
		leaderNameGetter(rawTeam.seniorCoach),
		leaderNameGetter(rawTeam.seniorMentor),
		asyncRight(
			Promise.all(
				rawTeam.members
					.map(memberNameGetter)
					.map(name => name.cata<MaybeObj<FullTeamMember>>(Maybe.none, Maybe.some)),
			),
			errorGenerator('Could not get team members'),
		),
		asyncRight(
			Promise.all(
				rawTeam.teamHistory
					.map(memberNameGetter)
					.map(name =>
						name.cata<MaybeObj<FullPreviousTeamMember>>(Maybe.none, Maybe.some),
					),
			),
			errorGenerator('Could not get team history'),
		),
	]).map(([cadetLeaderName, seniorCoachName, seniorMentorName, members, teamHistory]) => ({
		...rawTeam,
		members: members.filter(Maybe.isSome).map(get('value')),
		seniorCoachName,
		cadetLeaderName,
		seniorMentorName,
		teamHistory: teamHistory.filter(Maybe.isSome).map(get('value')),
	}));
};

export const createTeamFunc = (now = Date.now) => (emitter: MemberUpdateEventEmitter) => (
	schema: Schema,
) => (account: AccountObject) => (newTeam: NewTeamObject): ServerEither<RawTeamObject> =>
	asyncRight(
		schema.getCollection<RawTeamObject>('Teams'),
		errorGenerator('Could not get team ID'),
	)
		.flatMap(getNewID(account))
		.map(id => ({
			...newTeam,
			id,
			members: [],
			teamHistory: [],
			accountID: account.id,
		}))
		.flatMap(addToCollection(schema.getCollection<RawTeamObject>('Teams')))
		.map(addMembersToTeamFunc(now)(account)(emitter)(newTeam.members));
export const createTeam = createTeamFunc();

export const saveTeam = (schema: Schema) => (team: RawTeamObject): ServerEither<RawTeamObject> =>
	team.id === 0
		? asyncLeft({ type: 'OTHER', code: 400, message: 'Cannot save a dynamic team' })
		: asyncRight(team, errorGenerator('Could not save team'))
				.map(convertTeamToSaveObject)
				.flatMap(saveToCollectionA(schema.getCollection<RawTeamObject>('Teams')));

export const modfiyTeamMember = (member: NewTeamMember) => (
	team: RawTeamObject,
): RawTeamObject => ({
	...team,
	members: team.members.map(teamMember =>
		areMembersTheSame(member.reference)(teamMember.reference)
			? { ...teamMember, ...member }
			: teamMember,
	),
});

export const addMemberToTeamFunc = (now = Date.now) => (emitter: MemberUpdateEventEmitter) => (
	account: AccountObject,
) => (member: NewTeamMember) => (team: RawTeamObject) => {
	const newTeam = {
		...team,
		members: [
			...team.members,
			{
				...member,
				joined: now(),
			},
		],
	};

	emitter.emit('teamMemberAdd', {
		member: member.reference,
		account,
		team: newTeam,
	});

	return newTeam;
};
export const addMemberToTeam = addMemberToTeamFunc();

export const addMembersToTeamFunc = (now = Date.now) => (account: AccountObject) => (
	emitter: MemberUpdateEventEmitter,
) => (members: NewTeamMember[]) => (initialTeam: RawTeamObject): RawTeamObject =>
	members.reduce(
		(team, newMember) =>
			isPartOfTeam(newMember.reference)(team)
				? modfiyTeamMember(newMember)(team)
				: addMemberToTeamFunc(now)(emitter)(account)(newMember)(team),
		initialTeam,
	);
export const addMembersToTeam = addMembersToTeamFunc();

export const removeMemberFromTeamFunc = (now = Date.now) => (account: AccountObject) => (
	emitter: MemberUpdateEventEmitter,
) => (member: MemberReference) => (team: RawTeamObject) => {
	if (isPartOfTeam(member)(team) && !isTeamLeader(member)(team)) {
		const isOldMember = areMembersTheSame(member);

		const oldPart = team.members.find(teamMember => isOldMember(teamMember.reference))!;

		const newTeam: RawTeamObject = {
			...team,
			members: team.members.filter(teamMember => !isOldMember(teamMember.reference)),
			teamHistory: [
				...team.teamHistory,
				{
					job: oldPart.job,
					joined: oldPart.joined,
					reference: oldPart.reference,
					removed: now(),
				},
			],
		};

		emitter.emit('teamMemberRemove', {
			member,
			account,
			team: newTeam,
		});

		return newTeam;
	}

	return team;
};
export const removeMemberFromTeam = removeMemberFromTeamFunc();

export const removeMembersFromTeamFunc = (now = Date.now) => (account: AccountObject) => (
	emitter: MemberUpdateEventEmitter,
) => (members: MemberReference[]) => (initialTeam: RawTeamObject) =>
	members.reduce(
		(team, member) => removeMemberFromTeamFunc(now)(account)(emitter)(member)(team),
		initialTeam,
	);

export const convertTeamToSaveObject = (team: RawTeamObject): RawTeamObject => ({
	...team,
	members: team.members.map(({ reference, job, joined }) => ({
		job,
		joined,
		reference,
	})),
	teamHistory: team.teamHistory.map(({ reference, job, joined, removed }) => ({
		job,
		joined,
		reference,
		removed,
	})),
});

const removeTeamLeader = (account: AccountObject) => (emitter: MemberUpdateEventEmitter) => (
	team: RawTeamObject,
) => (type: 'cadetLeader' | 'seniorMentor' | 'seniorCoach') => {
	const leader = team[type];

	if (Maybe.isNone(leader)) {
		return team;
	}

	const newTeam = {
		...team,
		[type]: Maybe.none(),
	};

	emitter.emit('teamMemberRemove', {
		account,
		team: newTeam,
		member: leader.value,
	});

	return newTeam;
};

const setTeamLeader = (account: AccountObject) => (emitter: MemberUpdateEventEmitter) => (
	team: RawTeamObject,
) => (type: 'cadetLeader' | 'seniorMentor' | 'seniorCoach') => (member: MemberReference) => {
	if (Maybe.isSome(team[type])) {
		removeTeamLeader(account)(emitter)(team)(type);
	}

	const newTeam = {
		...team,
		[type]: Maybe.some(member),
	};

	emitter.emit('teamMemberAdd', {
		account,
		member,
		team: newTeam,
	});

	return newTeam;
};

const updateTeamLeader = (account: AccountObject) => (emitter: MemberUpdateEventEmitter) => (
	type: 'cadetLeader' | 'seniorMentor' | 'seniorCoach',
) => (member: MaybeObj<MemberReference>) => (team: RawTeamObject) =>
	Maybe.isSome(member)
		? setTeamLeader(account)(emitter)(team)(type)(member.value)
		: removeTeamLeader(account)(emitter)(team)(type);

export const handlePermissions = (member: MaybeObj<User>) => (publicity: TeamPublicity) => <
	T extends RawTeamMember
>(
	members: T[],
): T[] => (Maybe.isSome(member) || publicity === TeamPublicity.PUBLIC ? members : []);

export const httpStripTeamObject = (member: MaybeObj<User>) => <T extends RawTeamObject>(
	team: T,
): T => ({
	...team,
	members: handlePermissions(member)(team.visibility)(team.members),
	teamHistory: handlePermissions(member)(team.visibility)(team.teamHistory),
});

export const deleteTeam = (schema: Schema) => (account: AccountObject) => (
	emitter: MemberUpdateEventEmitter,
) => (team: RawTeamObject) =>
	(team.id === 0
		? asyncLeft<ServerError, Collection<RawTeamObject>>({
				type: 'OTHER',
				code: 400,
				message: 'Cannot operate on a dynamic team',
		  })
		: asyncRight(
				schema.getCollection<RawTeamObject>('Teams'),
				errorGenerator('Could not delete team'),
		  )
	)
		.tap(() => {
			removeMembersFromTeamFunc()(account)(emitter)(team.members.map(get('reference')))(team);

			removeTeamLeader(account)(emitter)(team)('cadetLeader');
			removeTeamLeader(account)(emitter)(team)('seniorCoach');
			removeTeamLeader(account)(emitter)(team)('seniorMentor');
		})
		.flatMap(deleteFromCollectionA(team));

const getDifferentTeamMembers = getItemsNotInSecondArray<NewTeamMember>(mem1 => mem2 =>
	areMembersTheSame(mem1.reference)(mem2.reference),
);

export const updateTeamMembersFunc = (now = Date.now) => (account: AccountObject) => (
	emitter: MemberUpdateEventEmitter,
) => (newMembers: NewTeamMember[]) => (team: RawTeamObject) =>
	pipe(
		removeMembersFromTeamFunc(now)(account)(emitter)(
			getDifferentTeamMembers(team.members)(newMembers).map(get('reference')),
		),
		addMembersToTeamFunc(now)(account)(emitter)(
			getDifferentTeamMembers(newMembers)(team.members),
		),
	)(team);
export const updateTeamMembers = updateTeamMembersFunc();

export const updateTeamFunc = (now = Date.now) => (account: AccountObject) => (
	emitter: MemberUpdateEventEmitter,
) => (team: RawTeamObject) => (newTeamInfo: NewTeamObject): RawTeamObject =>
	pipe(
		updateTeamMembersFunc(now)(account)(emitter)(newTeamInfo.members),
		updateTeamLeader(account)(emitter)('cadetLeader')(newTeamInfo.cadetLeader),
		updateTeamLeader(account)(emitter)('seniorCoach')(newTeamInfo.seniorCoach),
		updateTeamLeader(account)(emitter)('seniorMentor')(newTeamInfo.seniorMentor),
		set<RawTeamObject, 'name'>('name')(newTeamInfo.name),
		set<RawTeamObject, 'description'>('description')(newTeamInfo.description),
		set<RawTeamObject, 'visibility'>('visibility')(newTeamInfo.visibility),
	)(team);
export const updateTeam = updateTeamFunc();

export interface TeamsBackend {
	getTeam: (account: AccountObject) => (teamID: number) => ServerEither<RawTeamObject>;
}

export const getTeamsBackend = (req: MySQLRequest): TeamsBackend => ({
	getTeam: memoize(account => memoize(getTeam(req.mysqlx)(account))),
});
