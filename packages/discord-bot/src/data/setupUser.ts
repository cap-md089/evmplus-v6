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

import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	always,
	asyncIterFilter,
	asyncIterReduce,
	CAPMemberObject,
	collectGeneratorAsync,
	DiscordAccount,
	Either,
	EitherObj,
	get,
	getFullMemberName,
	getORGIDsFromCAPAccount,
	isPartOfTeam,
	isTeamLeader,
	Maybe,
	MaybeObj,
	Member,
	NHQ,
	pipe,
	RawTeamObject,
	ServerError,
} from 'common-lib';
import {
	Client,
	Guild,
	GuildMember,
	GuildMemberRoleManager,
	Permissions,
	Role,
	Collection,
} from 'discord.js';
import {
	collectResults,
	findAndBind,
	getAllAccountsForMember,
	getTeamObjects,
	resolveReference,
} from 'server-common';
import { getOrCreateTeamRolesForTeam } from './getTeamRole';

export const CadetExecutiveStaffRoles = [
	'Cadet Commander',
	'Cadet Deputy Commander',
	'Cadet Executive Officer',
];

export const CadetLineStaffRoles = [
	'Cadet First Sergeant',
	'Cadet Flight Commander',
	'Cadet Flight Sergeant',
	'Cadet Element Leader',
];

export const CadetSupportStaffRoles = [
	'Cadet Activities Officer',
	'Cadet Administrative Officer',
	'Cadet Aerospace Education Officer',
	'Cadet Communications Officer',
	'Cadet Drug Demand Reduction Officer',
	'Cadet Emergency Services Officer',
	'Cadet Historian Officer',
	'Cadet IT Officer',
	'Cadet Leadership Officer',
	'Cadet Operations Officer',
	'Cadet Public Affairs Officer',
	'Cadet Recruiting Officer',
	'Cadet Safety Officer',
	'Cadet Supply Officer',

	'Cadet Activities NCO',
	'Cadet Administrative NCO',
	'Cadet Aerospace Education NCO',
	'Cadet Communications NCO',
	'Cadet Drug Demand Reduction NCO',
	'Cadet Emergency Services NCO',
	'Cadet Historian NCO',
	'Cadet IT Officer NCO',
	'Cadet Leadership NCO',
	'Cadet Operations NCO',
	'Cadet Public Affairs NCO',
	'Cadet Recruiting NCO',
	'Cadet Safety NCO',
	'Cadet Supply NCO',
];

export const CACRepresentativeRoles = [
	'Cadet WCAC Representative',
	'Cadet WCAC Assistant',
	'Cadet GCAC Representative',
	'Cadet GCAC Assistant',
];

export const AchvIDToCertificationRole = {
	44: 'VFR Pilot',
	53: 'GES',
	55: 'MS',
	56: 'TMP',
	57: 'MP',
	58: 'Solo Pilot',
	59: 'Instructor Pilot',
	60: 'Check Pilot',
	61: 'IC3',
	63: 'OSC',
	64: 'PSC',
	65: 'LSC',
	66: 'FASC',
	67: 'AOBD',
	68: 'GBD',
	69: 'GTL',
	70: 'GTM3',
	71: 'UDF',
	72: 'PIO',
	73: 'FLS',
	74: 'FLM',
	75: 'CUL',
	76: 'MRO',
	77: 'MSO',
	78: 'LO',
	79: 'MC',
	80: 'MSA',
	81: 'MO',
	90: 'Mission Check Pilot',
	91: 'Orientation Pilot',
	92: 'Orientation Pilot',
	94: 'Solo Pilot',
	95: 'Achievement 1 (Curry)',
	96: 'Level 1',
	99: 'Glider Pilot',
	100: 'Check Pilot',
	101: 'Instructor Pilot',
	103: 'MFC',
	112: 'CD',
	124: 'SET',
	125: 'IC2',
	126: 'GTM2',
	127: 'GTM1',
	128: 'IC1',
	131: 'Level II',
	132: 'Level III',
	133: 'Level IV',
	134: 'Level V',
	138: 'Orientation Pilot',
	140: 'ARCHOPR',
	145: 'CISM',
	152: 'Tow Pilot',
	153: 'Cadet Pre',
	154: 'Command Pilot Rating',
	155: 'Glider Pilot Rating',
	156: 'Balloon Pilot Rating',
	160: 'Solo Pilot Rating',
	161: 'Pilot Rating',
	162: 'Senior Pilot Rating',
	164: 'Check Pilot Examiner',
	165: 'Check Pilot Examiner',
	166: 'Mission Check Pilot Examiner',
	169: 'OPS',
	176: 'IS100',
	177: 'IS200',
	178: 'ICS300',
	179: 'ICS400',
	180: 'IS700',
	181: 'IS800',
	182: 'WS',
	183: 'ARCHTRK',
	184: 'Instrument Pilot',
	185: 'ARCHSPC',
	186: 'FRO',
	187: 'SMC/BISC',
	188: 'SPC',
	189: 'WAO',
	190: 'UAO',
	191: 'CERT',
	192: 'NOCAUG',
	193: 'AP',
	194: 'ADIS',
	195: 'Instructor Pilot',
	196: 'Check Pilot',
	197: 'CAP Emergency Services Patch',
	198: 'CAP CN Observer',
	199: 'CAP Master Ground Team Badge',
	200: 'CAP Senior Ground Team Badge',
	201: 'CAP Basic Ground Team Badge',
	202: 'CAP Master Emergency Services Qualification Badge',
	203: 'CAP Senior Emergency Services Qualification Badge',
	204: 'CAP Basic Emergency Services Qualification Badge',
	205: 'CAP Master Observer Rating',
	206: 'CAP Senior Observer Rating',
	207: 'CAP Observer Rating',
	208: 'GFMC',
	209: 'GFMP',
	210: 'GFSO',
	211: 'CAP Drivers License',
	212: 'BCUT',
	213: 'ACUT',
	214: 'Instrument Pilot',
	215: 'Mission Check Pilot',
	216: 'GIIEP',
	217: 'ICUT',
	218: 'Air Crew Emergency Training (ACET) Instructor',
	219: 'VFR Pilot',
	220: 'Instructor Pilot',
	221: 'Check Pilot',
	222: 'Check Pilot Examiners',
	223: 'Instrument Pilot',
	224: 'WO – Winch Operator',
	225: 'WI – Winch Instructor',
	226: 'WE',
	227: 'ATO',
	228: 'ATI',
	229: 'ATE',
	230: 'TSK9',
	231: 'Balloon Pilot',
	232: 'Orientation Pilot',
	233: 'Instructor Pilot',
	234: 'Check Pilot',
	235: 'Check Pilot Examiner',
	236: 'Tow Pilot',
	237: 'Instructor Pilot',
	238: 'CAP Aircrew Rating',
	239: 'CAP Senior Aircrew Rating',
	240: 'CAP Master Aircrew Rating',
	241: 'Basic Incident Commander Badge',
	242: 'Senior Incident Commander Badge',
	243: 'Master Incident Commander Badge',
	244: 'Tow Pilot Trainer',
	245: 'ATC',
	246: 'Basic Medical',
	247: 'Basic Medical',
	248: 'SFRO',
	249: 'SFGC',
	250: 'PODC',
	251: 'DAARTU',
	252: 'DAARTO',
	253: 'MCCS',
	254: 'CSSCS',
	255: 'CSSDS',
	256: 'MCDS',
};

export const AllRoles = [
	...CadetExecutiveStaffRoles,
	...CadetLineStaffRoles,
	...CadetSupportStaffRoles,
	...CACRepresentativeRoles,
];

// TODO: Update this and its usages to instead find all roles that are not automatic
export const ManualRoles = [
	'Squadron Commander',
	'Deputy Commander for Cadets',
	'Assistant Deputy Commander for Cadets',
	'Discord Server PAO',
	'Presenter',
	'Announcer',
	'Previous Cadet Commander',
	'EvMPlus Software Developer',

	// Roles added by St. Mary's specifically
	'Minecraft',
	'Rocket League',
	'Among Us',
];

export const hasOneOf = <T>(arr1: T[]) => (arr2: T[]) =>
	arr2.map(includes(arr1)).reduce((prev, curr) => prev || curr, false);

export const includes = <T>(arr: T[]) => (elem: T) => arr.includes(elem);

export const hasExecutiveStaffRole = hasOneOf(CadetExecutiveStaffRoles);
export const hasSupportStaffRole = hasOneOf(CadetSupportStaffRoles);
export const hasLineStaffRole = hasOneOf(CadetLineStaffRoles);
export const hasCACRole = hasOneOf(CACRepresentativeRoles);

export const onlyJustValues = <T>(arr: MaybeObj<T>[]): T[] =>
	arr.filter(Maybe.isSome).map(Maybe.join) as T[];

export const byProp = <T, K extends keyof T = keyof T>(prop: K) => (value: T[K]) => (val: T) =>
	val[prop] === value;

export const byName = byProp<{ name: string }>('name');

const roleNamesToRoles = (rolesCollection: GuildMemberRoleManager) => (roleNames: string[]) =>
	rolesCollection.cache.array().filter(role => roleNames.includes(role.name));

const getDutyPositionRoles = (guild: Guild) => (orgids: number[]) => async (
	member: Member,
): Promise<Role[]> => {
	const categoryRoles = [];

	const dutyPositionNames = member.dutyPositions
		.filter(dp => dp.type === 'CAPUnit' || orgids.includes(dp.orgid))
		.map(dp => dp.duty);

	const extraRoles = dutyPositionNames.filter(name => !AllRoles.includes(name));

	const roles = (await guild.roles.fetch()).cache;

	if (hasExecutiveStaffRole(dutyPositionNames)) {
		categoryRoles.push(Maybe.fromValue(roles.find(byName('Cadet Executive Staff'))));

		if (dutyPositionNames.includes('Cadet Deputy Commander')) {
			categoryRoles.push(Maybe.fromValue(roles.find(byName('Cadet Line Staff'))));
		}

		if (dutyPositionNames.includes('Cadet Executive Officer')) {
			categoryRoles.push(Maybe.fromValue(roles.find(byName('Cadet Support Staff'))));
		}
	}

	if (hasLineStaffRole(dutyPositionNames)) {
		categoryRoles.push(Maybe.fromValue(roles.find(byName('Cadet Line Staff'))));
	}

	if (hasSupportStaffRole(dutyPositionNames) || extraRoles.length > 0) {
		categoryRoles.push(Maybe.fromValue(roles.find(byName('Cadet Support Staff'))));
	}

	if (hasCACRole(dutyPositionNames)) {
		categoryRoles.push(Maybe.fromValue(roles.find(byName('CAC Representative'))));
	}

	for (const role of extraRoles) {
		if (role.includes('OIC') || role.includes('Officer')) {
			if (roles.find(byName(role))) {
				// Already added, just use that one
				continue;
			}

			const position = [...roles.values()]
				.filter(({ name }) => name.includes('Officer') || name.includes('OIC'))
				.map(get('position'))
				.reduce((prev, curr) => Math.min(prev, curr), Number.POSITIVE_INFINITY);

			await guild.roles.create({
				data: {
					color: [17, 128, 106],
					hoist: false,
					mentionable: false,
					name: role,
					permissions: new Permissions(Permissions.DEFAULT)
						.remove(Permissions.FLAGS.CREATE_INSTANT_INVITE)
						.remove(Permissions.FLAGS.CHANGE_NICKNAME)
						.remove(Permissions.FLAGS.MENTION_EVERYONE),
					position,
				},
			});
		} else {
			if (roles.find(byName(role))) {
				// Already added, just use that one
				continue;
			}

			const position = [...roles.values()]
				.filter(({ name }) => name.includes('NCO'))
				.map(get('position'))
				.reduce((prev, curr) => Math.min(prev, curr), Number.POSITIVE_INFINITY);

			await guild.roles.create({
				data: {
					color: [17, 128, 106],
					hoist: false,
					mentionable: false,
					name: role,
					permissions: new Permissions(Permissions.DEFAULT)
						.remove(Permissions.FLAGS.MENTION_EVERYONE)
						.remove(Permissions.FLAGS.CREATE_INSTANT_INVITE)
						.remove(Permissions.FLAGS.CHANGE_NICKNAME),
					position,
				},
			});
		}
	}

	return onlyJustValues([
		...categoryRoles,
		...AllRoles.filter(includes(dutyPositionNames)).map(roleName =>
			Maybe.fromValue(roles.find(byName(roleName))),
		),
		...extraRoles.map(roleName => Maybe.fromValue(roles.find(byName(roleName)))),
	]);
};

const getSeniorMemberDutyPositions = (guild: Guild) => (orgids: number[]) => async (
	member: CAPMemberObject,
) => {
	const dutyPositions = member.dutyPositions
		.filter(position => position.type === 'NHQ' && orgids.includes(position.orgid))
		.map(get('duty'));

	const roles = (await guild.roles.fetch()).cache;

	return roles.array().filter(role => dutyPositions.includes(role.name));
};

const getFlightRoles = (guild: Guild) => async (member: Member): Promise<Role[]> => {
	if (member.flight !== null) {
		const isMatchingFlightRole = (flight: string) => (role: Role) =>
			!!role.name.match(new RegExp(`^${flight}( flight)?$`, 'i'));

		const roles = (await guild.roles.fetch()).cache;

		const flightRole = Maybe.fromValue(roles.find(isMatchingFlightRole(member.flight)));

		if (flightRole.hasValue) {
			const flightCategoryRole = roles.find(byName('Flight Member'));

			if (flightCategoryRole) {
				return [flightCategoryRole, flightRole.value];
			} else {
				return [flightRole.value];
			}
		} else {
			return [];
		}
	} else {
		return [];
	}
};

let currentTeamPromise: Promise<void> | null = null;

const getTeamRoles = (guild: Guild) => (schema: Schema) => (account: AccountObject) => (
	teams: RawTeamObject[],
) => async (member: Member): Promise<Role[]> => {
	if (teams.length === 0) {
		return [];
	}

	await currentTeamPromise;

	let resolve: () => void;

	currentTeamPromise = new Promise(_resolve => {
		resolve = _resolve;
	});

	const roles = (await guild.roles.fetch()).cache;

	const finalTeamRoles = [Maybe.fromValue(roles.find(byName('Team Member')))];

	// Team name background: rgb(194, 124, 14)
	// Team lead background: rgb(241, 196, 15)

	for (const team of teams) {
		if (team.id === 0) {
			continue;
		}

		const teamRoles = await getOrCreateTeamRolesForTeam(guild)(team);

		if (isTeamLeader(member)(team)) {
			finalTeamRoles.push(teamRoles[1]);
		}

		finalTeamRoles.push(teamRoles[2]);
	}

	resolve!();

	return onlyJustValues(finalTeamRoles);
};

const get101CardCertificationRoles = (guild: Guild) => (schema: Schema) => async (
	member: Member,
): Promise<Role[]> => {
	if (member.type !== 'CAPNHQMember') {
		return [];
	}

	const roles = (await guild.roles.fetch()).cache;

	const achievementIDs = await collectResults(
		findAndBind(schema.getCollection<NHQ.MbrAchievements>('NHQ_MbrAchievements'), {
			CAPID: member.id,
			Status: 'ACTIVE',
		}),
	);

	const realAchievementIDs = achievementIDs.filter(
		achv => achv.AchvID !== 95 && achv.AchvID !== 169,
	);

	if (realAchievementIDs.length === 0) {
		return [];
	}

	let roleNames = [
		'Certified',
		...realAchievementIDs.map(
			achv =>
				AchvIDToCertificationRole[achv.AchvID as keyof typeof AchvIDToCertificationRole],
		),
	];

	if (roleNames.includes('GTL')) {
		roleNames = roleNames.filter(
			name => !(name === 'GTM3' || name === 'GTM2' || name === 'GTM1'),
		);
	}
	if (roleNames.includes('GTM1')) {
		roleNames = roleNames.filter(name => !(name === 'GTM3' || name === 'GTM2'));
	}
	if (roleNames.includes('GTM2')) {
		roleNames = roleNames.filter(name => name !== 'GTM3');
	}

	return roles.filter(role => roleNames.includes(role.name)).array();
};

const setupRoles = (guild: Guild) => (schema: Schema) => (account: AccountObject) => (
	discordUser: GuildMember,
) => (teams: RawTeamObject[]) => async (member: Member) => {
	const roles = (await guild.roles.fetch()).cache;

	const finalRoles = new Collection<string, Role>();

	if (Maybe.isNone(account.discordServer)) {
		return;
	}

	const beforeRoles = roleNamesToRoles(discordUser.roles)(ManualRoles);

	const isAccountMember = await asyncIterReduce<EitherObj<ServerError, AccountObject>, boolean>(
		(prev, memberAccount) =>
			prev || Either.cata(always(false))(({ id }) => id === account.id)(memberAccount),
	)(false)(getAllAccountsForMember({})(schema)(member));

	if (isAccountMember) {
		if (member.seniorMember) {
			const [
				seniorMemberDutyPositions,
				es101CardCertifications,
				teamRoles,
			] = await Promise.all([
				getSeniorMemberDutyPositions(guild)(
					Maybe.orSome<number[]>([])(getORGIDsFromCAPAccount(account)),
				)(member),
				get101CardCertificationRoles(guild)(schema)(member),
				getTeamRoles(guild)(schema)(account)(teams)(member),
			]);

			const newRoles = [
				...beforeRoles,
				...seniorMemberDutyPositions,
				...es101CardCertifications,
				...teamRoles,
				...onlyJustValues([
					Maybe.fromValue(roles.find(byName('Senior Member'))),
					Maybe.fromValue(roles.find(byName('Certified Member'))),
				]),
			];

			for (const role of newRoles) {
				finalRoles.set(role.id, role);
			}
		} else {
			const [
				dutyPositionRoles,
				flightRoles,
				teamRoles,
				es101CardCertifications,
			] = await Promise.all([
				getDutyPositionRoles(guild)(
					Maybe.orSome<number[]>([])(getORGIDsFromCAPAccount(account)),
				)(member),
				account.discordServer.value.displayFlight ? getFlightRoles(guild)(member) : [],
				getTeamRoles(guild)(schema)(account)(teams)(member),
				get101CardCertificationRoles(guild)(schema)(member),
			]);

			const oldRoles = discordUser.roles.cache;

			let newRoles = [
				...beforeRoles,
				...dutyPositionRoles,
				...flightRoles,
				...teamRoles,
				...es101CardCertifications,
				...onlyJustValues([Maybe.fromValue(roles.find(byName('Certified Member')))]),
			];

			if (
				oldRoles.find(byName('Cadet Commander')) &&
				!finalRoles.find(byName('Cadet Commander'))
			) {
				const prevCommanderRole = roles.find(byName('Previous Cadet Commander'));

				if (prevCommanderRole) {
					newRoles.push(prevCommanderRole);
				}
			}

			if (
				!finalRoles.find(byName('Cadet Public Affairs NCO')) &&
				!finalRoles.find(byName('Cadet Public Affairs Officer'))
			) {
				newRoles = newRoles.filter(role => role.name !== 'Discord Server PAO');
			}

			for (const role of newRoles) {
				finalRoles.set(role.id, role);
			}
		}
	} else {
		const newRoles = [
			...(await getTeamRoles(guild)(schema)(account)(teams)(member)),
			...onlyJustValues([
				Maybe.fromValue(roles.find(byName('Certified Member'))),
				Maybe.fromValue(roles.find(byName('Guest'))),
			]),
		];

		for (const role of newRoles) {
			finalRoles.set(role.id, role);
		}
	}

	if (guild.ownerID !== discordUser.id) {
		// If there is actually a difference...
		if (
			finalRoles.difference(discordUser.roles.cache).size >= 0 ||
			discordUser.roles.cache.difference(finalRoles).size >= 0
		) {
			// ...set roles to avoid rate limiting
			// not everyone has their roles updating on a nightly basis

			// Set empty array because Discord acts weird otherwise
			await discordUser.roles.set([]);
			await discordUser.roles.set(finalRoles);
		}
	}
};

export default (client: Client) => (schema: Schema) => (guildID: string) => (
	account: AccountObject,
) => (teamObjects?: RawTeamObject[]) => async (discordUser: DiscordAccount) => {
	if (!account.discordServer.hasValue) {
		return;
	}

	try {
		const guild = await client.guilds.fetch(guildID);

		if (!guild) {
			return;
		}

		const user = await guild.members.fetch(discordUser.discordID);

		if (!user) {
			return;
		}

		if (!teamObjects) {
			teamObjects = await getTeamObjects(schema)(account)
				.map(
					pipe(
						asyncIterFilter<RawTeamObject>(team => team.id !== 0),
						asyncIterFilter<RawTeamObject>(isPartOfTeam(discordUser.member)),
					),
				)
				.map(collectGeneratorAsync)
				.fullJoin();
		}

		const member = await resolveReference(schema)(account)(discordUser.member).fullJoin();

		if (guild.ownerID !== discordUser.discordID) {
			await Promise.all([
				user.setNickname(getFullMemberName(member)),
				setupRoles(guild)(schema)(account)(user)(teamObjects)(member),
			]);
		}
	} catch (e) {
		console.error(e);
	}
};
