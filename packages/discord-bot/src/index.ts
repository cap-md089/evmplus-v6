/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as mysql from '@mysql/xdevapi';
import { validator } from 'auto-client-api';
import {
	collectGeneratorAsync,
	Either,
	isPartOfTeam,
	isTeamLeader,
	Maybe as M,
	MemberUpdateEventEmitter,
	RawServerConfiguration,
	ServerConfiguration,
	toReference,
	Validator,
} from 'common-lib';
import { Client } from 'discord.js';
import 'dotenv/config';
import { confFromRaw, getMembers, getRegistry, getTeamObjects } from 'server-common';
import attendancerecord from './commands/attendancerecord';
import getAccount from './data/getAccount';
import getDiscordAccount from './data/getDiscordAccount';
import getMember from './data/getMember';
import { getOrCreateTeamRolesForTeam } from './data/getTeamRole';
import setupUser from './data/setupUser';
import setupServer from './cli/setupServer';
import notifyRole from './cli/notifyRole';

export const getCertName = (name: string) => name.split('-')[0].trim();

export const getXSession = async ({ DB_SCHEMA }: ServerConfiguration, client: mysql.Client) => {
	const session = await client.getSession();

	return { session, schema: session.getSchema(DB_SCHEMA) };
};

export default function setup(
	conf: ServerConfiguration,
	capwatchEmitter: MemberUpdateEventEmitter,
	mysqlClient: mysql.Client,
) {
	if (!conf.DISCORD_CLIENT_TOKEN) {
		return;
	}

	const client = new Client();

	const userSetupFunction = setupUser(client);

	capwatchEmitter.on('capwatchImport', async accountObj => {
		const { schema, session } = await getXSession(conf, mysqlClient);

		const discordServer = accountObj.discordServer;

		if (!discordServer.hasValue) {
			return;
		}

		const guildUserSetup = userSetupFunction(schema)(discordServer.value.serverID);
		const account = await getAccount(schema)(discordServer.value.serverID);

		if (!account.hasValue) {
			return;
		}

		const setupForAccount = guildUserSetup(account.value);

		console.log('Applying CAPWATCH to Discord');

		const teams = await getTeamObjects(schema)(account.value)
			.map(collectGeneratorAsync)
			.fullJoin();

		for await (const member of getMembers(schema)(account.value)()) {
			if (Either.isLeft(member)) {
				continue;
			}

			const userAccount = await getDiscordAccount(schema)(toReference(member.value));

			if (!userAccount.hasValue) {
				continue;
			}

			await setupForAccount(teams)(userAccount.value);
		}

		console.log('Done applying CAPWATCH to Discord');

		await session.close();
	});

	capwatchEmitter.on('discordRegister', async ({ user, account: accountObj }) => {
		const { schema, session } = await getXSession(conf, mysqlClient);

		const discordServer = accountObj.discordServer;

		if (!discordServer.hasValue) {
			return;
		}

		const guildUserSetup = userSetupFunction(schema)(discordServer.value.serverID);
		const account = await getAccount(schema)(discordServer.value.serverID);

		if (!account.hasValue) {
			return;
		}

		await guildUserSetup(account.value)()(user);

		await session.close();
	});

	capwatchEmitter.on('teamMemberRemove', async ({ account, member, team }) => {
		const { schema, session } = await getXSession(conf, mysqlClient);

		const discordServer = account.discordServer;

		if (!discordServer.hasValue) {
			return;
		}

		const guild = client.guilds.get(discordServer.value.serverID);

		if (!guild) {
			return;
		}

		const [discordAccountMaybe, [genericTeamRole, leaderRole, memberRole]] = await Promise.all([
			getDiscordAccount(schema)(toReference(member)),
			getOrCreateTeamRolesForTeam(guild)(team),
		]);

		if (!discordAccountMaybe.hasValue) {
			return;
		}

		const guildMember = guild.members.get(discordAccountMaybe.value.discordID);

		if (!guildMember) {
			return;
		}

		let newRoles = guildMember.roles.clone();

		if (M.isSome(leaderRole) && !isTeamLeader(member)(team)) {
			newRoles = newRoles.filter(role => role.id !== leaderRole.value.id);
		}

		if (M.isSome(memberRole) && !isPartOfTeam(member)(team)) {
			newRoles = newRoles.filter(role => role.id !== memberRole.value.id);
		}

		if (M.isSome(genericTeamRole)) {
			const hasTeamRole = !!newRoles.find(
				role =>
					role.name.toLowerCase().includes('team') &&
					!role.hexColor.toLowerCase().endsWith('71368a'),
			);
			if (!hasTeamRole) {
				newRoles = newRoles.filter(role => role.id !== genericTeamRole.value.id);
			}
		}

		await guildMember.setRoles(newRoles);

		await session.close();
	});

	capwatchEmitter.on('teamMemberAdd', async ({ account, member, team }) => {
		const { schema, session } = await getXSession(conf, mysqlClient);

		const discordServer = account.discordServer;

		if (!discordServer.hasValue) {
			return;
		}

		const guild = client.guilds.get(discordServer.value.serverID);

		if (!guild) {
			return;
		}

		const [discordAccountMaybe, [genericTeamRole, leaderRole, memberRole]] = await Promise.all([
			getDiscordAccount(schema)(toReference(member)),
			getOrCreateTeamRolesForTeam(guild)(team),
		]);

		if (!discordAccountMaybe.hasValue) {
			return;
		}

		const guildMember = guild.members.get(discordAccountMaybe.value.discordID);

		if (!guildMember) {
			return;
		}

		const newRoles = guildMember.roles.clone();

		if (M.isSome(leaderRole) && isTeamLeader(member)(team)) {
			newRoles.set(leaderRole.value.id, leaderRole.value);
		}

		if (M.isSome(genericTeamRole)) {
			newRoles.set(genericTeamRole.value.id, genericTeamRole.value);
		}

		if (M.isSome(memberRole)) {
			newRoles.set(memberRole.value.id, memberRole.value);
		}

		await guildMember.setRoles(newRoles);

		await session.close();
	});

	capwatchEmitter.on('memberChange', async ({ member, account: accountObj }) => {
		const { schema, session } = await getXSession(conf, mysqlClient);

		console.log('Changing member information for', member);

		const discordServer = accountObj.discordServer;

		if (!discordServer.hasValue) {
			return;
		}

		const guildUserSetup = userSetupFunction(schema)(discordServer.value.serverID);
		const account = await getAccount(schema)(discordServer.value.serverID);

		if (!account.hasValue) {
			return;
		}

		const userAccount = await getDiscordAccount(schema)(toReference(member));

		if (!userAccount.hasValue) {
			return;
		}

		await guildUserSetup(account.value)()(userAccount.value);

		await session.close();
	});

	client.on('ready', () => {
		console.log('Bot ready');
	});

	client.on('guildMemberAdd', async member => {
		const { schema, session } = await getXSession(conf, mysqlClient);
		const account = await getAccount(schema)(member.guild.id);

		if (!account.hasValue) {
			return;
		}

		const capunitMember = await getMember(schema)(member);

		if (capunitMember.hasValue) {
			await setupUser(client)(schema)(member.guild.id)(account.value)()(capunitMember.value);
		} else {
			const registry = await getRegistry(schema)(account.value).fullJoin();

			const dmChannel = await member.createDM();

			dmChannel.send(
				`Welcome to the ${registry.Website.Name} Discord server. Please go to the following page on your squadron's website to finish account setup: https://${account.value.id}.capunit.com/registerdiscord/${member.id}`,
			);

			await session.close();
		}
	});

	client.on('message', message => {
		const parts = message.content.split(' ');

		if (parts[0] === `<@!${client.user.id}>` && message.member.id !== client.user.id) {
			if (parts.length < 2) {
				message.reply('Command needed; known commands are "attendancerecord"');
				return;
			}

			switch (parts[1].toLowerCase()) {
				case 'attendancerecord':
					attendancerecord(client)(mysqlClient)(conf)(parts)(message);

					break;
			}
		}
	});

	client.login(conf.DISCORD_CLIENT_TOKEN);
}

if (require.main === module) {
	(async () => {
		const client = new Client();

		const configurationValidator = validator<RawServerConfiguration>(Validator);

		const confEither = Either.map(confFromRaw)(
			configurationValidator.validate(process.env, ''),
		);

		if (Either.isLeft(confEither)) {
			console.error('Configuration error!', confEither.value);
			process.exit(1);
		}

		const conf = confEither.value;

		const mysqlClient = await mysql.getClient(
			`mysqlx://${conf.DB_USER}:${conf.DB_PASSWORD}@${conf.DB_HOST}:${conf.DB_PORT}`,
			{
				pooling: {
					enabled: false,
				},
			},
		);

		if (process.argv.length === 2) {
			console.error('Not enough arguments!');
			process.exit(1);
		}

		return new Promise((resolve, reject) => {
			const command = process.argv[2];

			const availableCommands: { [key: string]: typeof setupServer } = {
				setupserver: setupServer,
				notifyrole: notifyRole,
			};

			const commandFunction = availableCommands[command.toLowerCase()];

			if (!commandFunction) {
				console.error('Available commands:', Object.keys(availableCommands));
				return reject(new Error(`Unknown command ${command.toLowerCase()}`));
			}

			client.on('ready', async () => {
				try {
					const args = process.argv.slice(3);

					await commandFunction(mysqlClient, conf, client, args);

					// const session = await mysqlClient.getSession();
					// const schema = session.getSchema('EventManagementv6');

					// const accountMaybe = await getAccount(schema)('437034622090477568');

					// if (!accountMaybe.hasValue) {
					// 	return;
					// }

					// const teams = await getTeamObjects(schema)(accountMaybe.value)
					// 	// block the staff team
					// 	.map(asyncIterFilter((team) => team.id !== 0))
					// 	.map(
					// 		asyncIterFilter<RawTeamObject>(
					// 			isPartOfTeam({ type: 'CAPNHQMember', id: 542488 })
					// 		)
					// 	)
					// 	.map(asyncIterMap(get('id')))
					// 	.map(collectGeneratorAsync)
					// 	.fullJoin();

					// await setupUser(client)(schema)('437034622090477568')(accountMaybe.value)(
					// 	teams
					// )({
					// 	discordID: '192688519045578762',
					// 	member: { type: 'CAPNHQMember', id: 542488 },
					// });
					resolve();
				} catch (e) {
					reject(e);
				}
			});

			client.login(conf.DISCORD_CLIENT_TOKEN);
		});
	})().then(
		() => {
			process.exit(0);
		},
		err => {
			console.error(err);
			process.exit(1);
		},
	);
}
