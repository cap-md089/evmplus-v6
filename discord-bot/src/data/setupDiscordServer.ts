import * as mysql from '@mysql/xdevapi';
import { DiscordAccount, ServerConfiguration } from 'common-lib';
import { Client, Guild, Permissions } from 'discord.js';
import { collectResults, findAndBind, getRegistry } from 'server-common';
import { getXSession } from '..';
import getAccount from './getAccount';
import setupUser, {
	AchvIDToCertificationRole,
	byName,
	CACRepresentativeRoles,
	CadetExecutiveStaffRoles,
	CadetLineStaffRoles,
	CadetSupportStaffRoles,
} from './setupUser';

export interface DiscordSetupRules {
	deleteOldRoles: boolean;
	addSeniorMemberRoles: boolean;
	addCadetExecutiveStaffRoles: boolean;
	addCadetSquadronCommanderRoles: boolean;
	addCadetLineStaffRoles: boolean;
	addCadetSupportStaffRoles: boolean;
	addCACRepresentativeRoles: boolean;
	addTeamRoles: boolean;
	addESRoles: boolean;
	addFlightMemberRoles: string[];
	preserveRoles: string[];
	itOfficerAdmin: boolean;
}

const hasRole = (roleName: string) => (guild: Guild) => !!guild.roles.find(byName(roleName));

const hasCertifiedMember = hasRole('Certified Member');
const hasProcessing = hasRole('Processing');

const seniorMemberRoles = ['Squadron Commander'];

export const setupCAPServer = (config: ServerConfiguration) => (mysql: mysql.Client) => (
	client: Client
) => (guildId: string) => async (rules: Partial<DiscordSetupRules>) => {
	const { schema, session } = await getXSession(config, mysql);

	console.log(client.guilds.keyArray());

	const guild = client.guilds.get(guildId);

	if (!guild) {
		throw new Error('Guild not found');
	}

	let account = await getAccount(schema)(guildId);

	if (!account.hasValue) {
		throw new Error('No account is associated with that guild');
	}

	const registry = await getRegistry(schema)(account.value).fullJoin();

	const usedRules: DiscordSetupRules = {
		deleteOldRoles: true,
		addSeniorMemberRoles: true,
		addCadetExecutiveStaffRoles: true,
		addCadetSquadronCommanderRoles: false,
		addCadetLineStaffRoles: true,
		addCadetSupportStaffRoles: true,
		addCACRepresentativeRoles: true,
		addTeamRoles: true,
		addESRoles: true,
		addFlightMemberRoles: registry.RankAndFile.Flights,
		preserveRoles: [],
		itOfficerAdmin: false,

		...rules,
	};

	if (usedRules.deleteOldRoles) {
		for (const role of guild.roles.values()) {
			if (!usedRules.preserveRoles.includes(role.name)) {
				try {
					await role.delete();
				} catch (err) {
					// Could be a bot or something similar
					console.log(err);
				}
			}
		}

		console.log('Done deleting roles. Creating new ones...');
	}

	const permissions = new Permissions(Permissions.DEFAULT)
		.remove(Permissions.FLAGS.CREATE_INSTANT_INVITE!)
		.remove(Permissions.FLAGS.CHANGE_NICKNAME!);

	const createRole = (color: [number, number, number]) => (name: string) =>
		guild.createRole({
			hoist: false,
			mentionable: false,
			name,
			permissions,
			position: 0,
			color,
		});

	const createRoleGroup = (color: [number, number, number]) => (name: string) =>
		guild.createRole({
			hoist: true,
			mentionable: false,
			name,
			permissions,
			position: 0,
			color,
		});

	if (usedRules.addSeniorMemberRoles) {
		await createRoleGroup([230, 126, 34])('Senior Member');

		const seniorMemberCreater = createRole([168, 67, 0]);
		for (const name of seniorMemberRoles) {
			await seniorMemberCreater(name);
		}
	}

	if (usedRules.addCadetExecutiveStaffRoles) {
		await createRoleGroup([231, 76, 60])('Cadet Executive Staff');

		const executiveStaffCreater = createRole([153, 45, 34]);
		for (const name of CadetExecutiveStaffRoles) {
			await executiveStaffCreater(name);
		}
	}

	if (usedRules.addCadetSquadronCommanderRoles) {
		await createRoleGroup([52, 152, 219])('Cadet Line Staff');

		await createRole([32, 102, 148])('Cadet Squadron Commander');
	}

	if (usedRules.addCadetLineStaffRoles) {
		if (!usedRules.addCadetSquadronCommanderRoles) {
			await createRoleGroup([52, 152, 219])('Cadet Line Staff');
		}

		for (const name of CadetLineStaffRoles.filter(
			(name) => name !== 'Cadet Squadron Commander'
		)) {
			await createRole([32, 102, 148])(name);
		}
	}

	if (usedRules.addCadetSupportStaffRoles) {
		await createRoleGroup([26, 188, 156])('Cadet Support Staff');

		for (const name of CadetSupportStaffRoles) {
			if (name === 'Cadet IT Officer' && usedRules.itOfficerAdmin) {
				await guild.createRole({
					hoist: false,
					mentionable: false,
					name,
					permissions: new Permissions(Permissions.DEFAULT).add(
						Permissions.FLAGS.ADMINISTRATOR!
					),
					position: 0,
					color: [17, 128, 106],
				});
			} else {
				await createRole([17, 128, 106])(name);
			}
		}
	}

	if (usedRules.addCACRepresentativeRoles) {
		await createRoleGroup([255, 255, 255])('CAC Representative');

		for (const name of CACRepresentativeRoles) {
			await createRole([238, 238, 238])(name);
		}
	}

	if (usedRules.addTeamRoles) {
		await createRole([241, 196, 15])('Team Member');
	}

	if (usedRules.addESRoles) {
		await createRole([159, 89, 182])('Certified');

		for (const key in AchvIDToCertificationRole) {
			await createRole([113, 54, 138])(
				AchvIDToCertificationRole[
					(key as unknown) as keyof typeof AchvIDToCertificationRole
				]
			);
		}
	}

	if (usedRules.addFlightMemberRoles.length > 0) {
		await createRoleGroup([149, 165, 166])('Flight Member');

		for (const name of usedRules.addFlightMemberRoles) {
			await createRole([151, 156, 159])(`${name} Flight`);
		}
	}

	if (!hasCertifiedMember(guild)) {
		await createRole([153, 170, 181])('Certified Member');
	}

	if (!hasProcessing(guild)) {
		await createRole([153, 170, 181])('Processing');
	}

	const collection = schema.getCollection<DiscordAccount>('DiscordAccounts');

	for (const member of guild.members.array()) {
		const results = await collectResults(findAndBind(collection, { discordID: member.id }));

		if (guild.ownerID !== member.id && !member.user.bot) {
			if (results.length === 1) {
				await setupUser(client)(schema)(guildId)(account.value)()(results[0]);
			} else {
				await (await member.setRoles([guild.roles.find(byName('Processing'))])).setNickname(
					''
				);

				try {
					const dmChannel = await member.createDM();

					if (dmChannel.messages.size === 0) {
						await dmChannel.send(
							`Welcome to the ${registry.Website.Name} Discord server. Please go to the following page on your squadron's website to finish account setup: https://${account.value.id}.capunit.com/signin/?returnurl=/registerdiscord/${member.id}`
						);
					}
				} catch (e) {
					console.error('Cannot send message to ', member.displayName);
				}
			}
		}
	}

	await session.close();
};

export default setupCAPServer;