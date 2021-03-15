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

import * as mysql from '@mysql/xdevapi';
import {
	AccountObject,
	asyncIterFilter,
	collectGeneratorAsync,
	DiscordAccount,
	isPartOfTeam,
	Maybe,
	RawTeamObject,
} from 'common-lib';
import { Client, Guild, Role } from 'discord.js';
import { collectResults, findAndBind, getTeamObjects } from 'server-common';
import getAccountForDiscordServer from '../data/getAccount';
import setupUser, { byName } from '../data/setupUser';
import { DiscordCLIConfiguration } from '../getDiscordConf';

export default async (
	mysqlClient: mysql.Client,
	conf: DiscordCLIConfiguration,
	client: Client,
	args: string[],
) => {
	const session = await mysqlClient.getSession();
	const schema = session.getSchema(conf.DB_SCHEMA);

	const setupServer = async (id: string, guild: Guild) => {
		const accountMaybe = await getAccountForDiscordServer(schema)(id);

		if (Maybe.isNone(accountMaybe)) {
			return;
		}

		const account = accountMaybe.value;

		console.log(`Updating ${account.id} (${id})...`);

		const teams = await getTeamObjects(schema)(accountMaybe.value)
			// block the staff team
			.map(asyncIterFilter(team => team.id !== 0))
			.map(collectGeneratorAsync)
			.fullJoin();

		const collection = schema.getCollection<DiscordAccount>('DiscordAccounts');

		for (const [_, member] of await guild.members.fetch()) {
			const results = await collectResults(findAndBind(collection, { discordID: member.id }));

			if (guild.ownerID !== member.id && !member.user.bot) {
				if (results.length === 1) {
					console.log(`Updating ${member.displayName}`);
					await setupUser(client)(schema)(id)(account)(
						teams.filter(isPartOfTeam(results[0].member)),
					)(results[0]);
				} else {
					await (
						await member.roles.set(
							[(await guild.roles.fetch()).cache.find(byName('Processing'))].filter(
								(role): role is Role => !!role,
							),
						)
					).setNickname('');

					try {
						const dmChannel = await member.createDM();
						if (!dmChannel.messages.channel.lastMessage) {
							// 	await dmChannel.send(
							// 		`Welcome to the ${registry.Website.Name} Discord server. Please go to the following page on your squadron's website to finish account setup: https://${account.value.id}.${conf.HOST_NAME}/signin/?returnurl=/registerdiscord/${member.id}`
							// 	);
							console.log('Empty chat:', member.displayName);
						}
					} catch (e) {
						console.error('Cannot send message to ', member.displayName);
					}
				}
			}
		}

		console.log(`Updated ${account.id} (${id}).`);
	};

	try {
		if (args.length === 1) {
			const guild = await client.guilds.fetch(args[0]);

			if (!guild) {
				throw new Error('Guild not found!');
			}

			await setupServer(args[0], guild);
		} else if (args.length === 2) {
			const guild = await client.guilds.fetch(args[0]);

			if (!guild) {
				throw new Error('Guild not found!');
			}

			const member = await guild.members.fetch(args[1]);

			if (!member) {
				throw new Error('Member not found');
			}

			const accountMaybe = await getAccountForDiscordServer(schema)(args[0]);

			if (Maybe.isNone(accountMaybe)) {
				throw new Error('Guild does not have an account');
			}

			const account = accountMaybe.value;

			const collection = schema.getCollection<DiscordAccount>('DiscordAccounts');
			const results = await collectResults(findAndBind(collection, { discordID: member.id }));

			if (guild.ownerID !== member.id && !member.user.bot) {
				if (results.length === 1) {
					const teams = await getTeamObjects(schema)(accountMaybe.value)
						// block the staff team
						.map(asyncIterFilter(team => team.id !== 0))
						.map(asyncIterFilter<RawTeamObject>(isPartOfTeam(results[0].member)))
						.map(collectGeneratorAsync)
						.fullJoin();

					console.log(`Updating ${member.displayName}`);
					await setupUser(client)(schema)(args[0])(account)(teams)(results[0]);
				} else {
					await (
						await member.roles.set(
							[(await guild.roles.fetch()).cache.find(byName('Processing'))].filter(
								(role): role is Role => !!role,
							),
						)
					).setNickname('');

					try {
						const dmChannel = await member.createDM();
						if (!dmChannel.messages.channel.lastMessage) {
							// 	await dmChannel.send(
							// 		`Welcome to the ${registry.Website.Name} Discord server. Please go to the following page on your squadron's website to finish account setup: https://${account.value.id}.${conf.HOST_NAME}/signin/?returnurl=/registerdiscord/${member.id}`
							// 	);
							console.log('Empty chat:', member.displayName);
						}
					} catch (e) {
						console.error('Cannot send message to ', member.displayName);
					}
				}
			}
		} else {
			const accounts = (
				await schema.getCollection<AccountObject>('Accounts').find('true').execute()
			).fetchAll();

			try {
				for (const account of accounts) {
					if (Maybe.isSome(account.discordServer)) {
						const guild = await client.guilds.fetch(
							account.discordServer.value.serverID,
						);

						await setupServer(account.discordServer.value.serverID, guild);
					}
				}
			} catch (e) {
				console.error('Could not update Discord server', e);
			}
		}
	} finally {
		await session.close();
	}
};
