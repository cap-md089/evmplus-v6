import { Schema } from '@mysql/xdevapi';
import { DiscordAccount, fromValue, just, Maybe, RawTeamObject, NHQ } from 'common-lib';
import { Client, Guild, GuildMember, Role, Collection } from 'discord.js';
import {
	Account,
	MemberClasses,
	resolveReference,
	Team,
	collectResults,
	findAndBind
} from '../lib/internals';

const CadetExecutiveStaffRoles = [
	'Cadet Commander',
	'Cadet Deputy Commander',
	'Cadet Executive Officer'
];

const CadetLineStaffRoles = [
	'Cadet First Sergeant',
	'Cadet Flight Commander',
	'Cadet Flight Sergeant',
	'Cadet Element Leader'
];

const CadetSupportStaffRoles = [
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
	'Cadet Supply NCO'
];

const CACRepresentativeRoles = [
	'Cadet WCAC Representative',
	'Cadet WCAC Assistant',
	'Cadet GCAC Representative',
	'Cadet GCAC Assistant'
];

const AchvIDToCertificationRole = {
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
	256: 'MCDS'
};

const ManualRoles = [
	'Squadron Commander',
	'Deputy Commander for Cadets',
	'Assistant Deputy Commander for Cadets',
	'Squadron Software Developer',
	'Bot Developer',
	'Website Developer',
	'Discord Server PAO',
	'Previous Cadet Commander'
];

const hasOneOf = <T>(arr1: T[]) => (arr2: T[]) =>
	arr2.map(includes(arr1)).reduce((prev, curr) => prev || curr, false);

const includes = <T>(arr: T[]) => (elem: T) => arr.includes(elem);

const hasExecutiveStaffRole = hasOneOf(CadetExecutiveStaffRoles);
const hasSupportStaffRole = hasOneOf(CadetSupportStaffRoles);
const hasLineStaffRole = hasOneOf(CadetLineStaffRoles);
const hasCACRole = hasOneOf(CACRepresentativeRoles);

const onlyJustValues = <T>(arr: Maybe<T>[]): T[] => arr.filter(v => v.isSome()).map(v => v.some());

const byProp = <T, K extends keyof T = keyof T>(prop: K) => (value: T[K]) => (val: T) =>
	val[prop] === value;

const byName = byProp<{ name: string }>('name');

const roleNamesToRoles = (rolesCollection: Collection<string, Role>) => (roleNames: string[]) =>
	rolesCollection.array().filter(role => roleNames.includes(role.name));

const getDutyPositionRoles = (guild: Guild) => (member: MemberClasses): Role[] => {
	const categoryRoles = [];

	const dutyPositionNames = member.dutyPositions.map(dp => dp.duty);

	if (hasExecutiveStaffRole(dutyPositionNames)) {
		categoryRoles.push(fromValue(guild.roles.find(byName('Cadet Executive Staff'))));
	}

	if (hasLineStaffRole(dutyPositionNames)) {
		categoryRoles.push(fromValue(guild.roles.find(byName('Cadet Line Staff'))));
	}

	if (hasSupportStaffRole(dutyPositionNames)) {
		categoryRoles.push(fromValue(guild.roles.find(byName('Cadet Support Staff'))));
	}

	if (hasCACRole(dutyPositionNames)) {
		categoryRoles.push(fromValue(guild.roles.find(byName('CAC Representative'))));
	}

	const allRoles = [
		...CadetExecutiveStaffRoles,
		...CadetLineStaffRoles,
		...CadetSupportStaffRoles,
		...CACRepresentativeRoles
	];

	return onlyJustValues([
		...categoryRoles,
		...allRoles
			.filter(includes(dutyPositionNames))
			.map(roleName => fromValue(guild.roles.find(byName(roleName))))
	]);
};

const getFlightRoles = (guild: Guild) => (member: MemberClasses): Role[] => {
	if (member.flight !== null) {
		const isFlightRole = (flight: string) => {
			flight = flight.toLowerCase();
			return (role: Role) => {
				return role.name.toLowerCase() === `${flight} flight`;
			};
		};

		let flightRole = fromValue(guild.roles.find(isFlightRole(member.flight)));

		if (flightRole.hasValue) {
			const flightCategoryRole = guild.roles.find(byName('Flight Member'));

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

const getTeamRoles = (guild: Guild) => (schema: Schema) => (account: Account) => async (
	member: MemberClasses
): Promise<Role[]> => {
	// The staff team is already done in great detail by other roles, such as 'Cadet Support Staff'
	const teamIDs = member.teamIDs.filter(team => team !== 0);

	if (teamIDs.length === 0) {
		return [];
	}

	const renderTeamName = (team: RawTeamObject) =>
		team.name.toLowerCase().includes('team') ? team.name : `${team.name} Team`;

	let teamRoleInsertionPoint = guild.roles
		.array()
		.filter(role => role.name.toLowerCase().includes('team'))
		.map(role => role.position)
		.reduce((prev, curr) => Math.min(prev, curr), Number.POSITIVE_INFINITY);

	let teamLeadRoleInsertionPoint = Math.min(
		fromValue(guild.roles.find(byName('Team Member')))
			.map(r => r.position)
			.orSome(Number.POSITIVE_INFINITY),
		guild.roles
			.array()
			.filter(role => role.name.toLowerCase().includes('team lead'))
			.map(role => role.position)
			.reduce((prev, curr) => Math.min(prev, curr), Number.POSITIVE_INFINITY)
	);

	const roles = [fromValue(guild.roles.find(byName('Team Member')))];

	// Team name background: rgb(194, 124, 14)
	// Team lead background: rgb(241, 196, 15)

	for (const teamID of teamIDs) {
		const team = await Team.Get(teamID, account, schema);

		if (team.isLeader(member)) {
			let role = guild.roles.find(byName(`Team Lead - ${team.name}`));

			if (!role) {
				role = await guild.createRole({
					color: [241, 196, 15],
					hoist: false,
					mentionable: false,
					name: `Team Lead - ${team.name}`,
					position: teamLeadRoleInsertionPoint
				});

				teamRoleInsertionPoint--;
			}

			roles.push(just(role));
		}

		let role = guild.roles.find(byName(renderTeamName(team)));

		if (!role) {
			role = await guild.createRole({
				color: [194, 124, 14],
				hoist: false,
				mentionable: false,
				name: renderTeamName(team),
				position: teamRoleInsertionPoint
			});
		}

		roles.push(just(role));
	}

	return onlyJustValues(roles);
};

const get101CardCertificationRoles = (guild: Guild) => (schema: Schema) => async (
	member: MemberClasses
): Promise<Role[]> => {
	if (member.type !== 'CAPNHQMember') {
		return [];
	}

	const achievementIDs = await collectResults(
		findAndBind(schema.getCollection<NHQ.MbrAchievements>('NHQ_MbrAchievements'), {
			CAPID: member.id
		})
	);

	const realAchievementIDs = achievementIDs.filter(
		achv => achv.AchvID !== 95 && achv.AchvID !== 169
	);

	if (member.id === 622973) {
		console.log(achievementIDs);
		console.log(realAchievementIDs);
	}

	if (realAchievementIDs.length === 0) {
		return [];
	}

	let roleNames = [
		'Certified',
		...realAchievementIDs.map(
			achv => AchvIDToCertificationRole[achv.AchvID as keyof typeof AchvIDToCertificationRole]
		)
	];

	if (roleNames.includes('GTL')) {
		roleNames = roleNames.filter(
			name => !(name === 'GTM3' || name === 'GTM2' || name === 'GTM1')
		);
	}
	if (roleNames.includes('GTM1')) {
		roleNames = roleNames.filter(name => !(name === 'GTM3' || name === 'GTM2'));
	}
	if (roleNames.includes('GTM2')) {
		roleNames = roleNames.filter(name => name !== 'GTM3');
	}

	return guild.roles.filter(role => roleNames.includes(role.name)).array();
};

const setupRoles = (guild: Guild) => (schema: Schema) => (account: Account) => (
	discordUser: GuildMember
) => async (member: MemberClasses) => {
	let roles: Role[];

	const beforeRoles = roleNamesToRoles(discordUser.roles)(ManualRoles);

	if (member.seniorMember) {
		roles = [
			...beforeRoles,
			...(await get101CardCertificationRoles(guild)(schema)(member)),
			...onlyJustValues([fromValue(guild.roles.find(byName('Senior Member')))])
		];
	} else {
		const oldRoles = discordUser.roles;

		roles = [
			...beforeRoles,
			...getDutyPositionRoles(guild)(member),
			...getFlightRoles(guild)(member),
			...(await get101CardCertificationRoles(guild)(schema)(member)),
			...(await getTeamRoles(guild)(schema)(account)(member))
		];

		if (oldRoles.find(byName('Cadet Commander')) && !roles.find(byName('Cadet Commander'))) {
			const prevCommanderRole = guild.roles.find(byName('Previous Cadet Commander'));

			if (prevCommanderRole) {
				roles.push(prevCommanderRole);
			}
		}

		if (
			!roles.find(byName('Cadet Public Affairs NCO')) &&
			!roles.find(byName('Cadet Public Affairs Officer'))
		) {
			roles = roles.filter(role => role.name !== 'Discord Server PAO');
		}
	}

	if (guild.ownerID !== discordUser.id) {
		await discordUser.setRoles(roles);
	}
};

export default (client: Client) => (schema: Schema) => (guildID: string) => (
	account: Account
) => async (discordUser: DiscordAccount) => {
	if (!account.discordServer.hasValue) {
		return;
	}

	try {
		const guild = client.guilds.get(guildID);

		if (!guild) {
			return;
		}

		const user = guild.members.get(discordUser.discordID);

		if (!user) {
			return;
		}

		const member = await resolveReference(discordUser.member, account, schema, true);

		if (guild.ownerID !== discordUser.discordID) {
			await user.setNickname(member.getFullName());
		}
		await setupRoles(guild)(schema)(account)(user)(member);
	} catch (e) {
		console.error(e);
	}
};
