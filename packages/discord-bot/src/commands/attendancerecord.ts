/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Client, CommandInteraction, GuildMember, VoiceChannel } from 'discord.js';
import * as mysql from '@mysql/xdevapi';
import { DiscordCLIConfiguration } from '../getDiscordConf';
import { areMembersTheSame, asyncIterMap, asyncRight, AttendanceStatus, collectGeneratorAsync, Either, errorGenerator, get, getFullMemberName, hasBasicAttendanceManagementPermission, identity, iterCollect, Maybe, pipe, toReference, User } from 'common-lib';
import { getXSession } from '..';
import { getDiscordBackend } from '../data/getDiscordBackend';
import getAccount from '../data/getAccount';
import getMember from '../data/getMember';
import { PAM } from 'server-common';
import { toCAPUnit } from '../data/convertMember';

export default (client: Client) => (mysqlClient: mysql.Client) => (conf: DiscordCLIConfiguration) => async (interaction: CommandInteraction): Promise<void> => {
	const eventID = interaction.options.getInteger('eventid');
	const method = interaction.options.getString('target') as 'global' | 'withme';

	if (eventID === null) {
		await interaction.reply('Event ID has to be a number');
		return;
	}

	let guild;
	try {
		guild = await client.guilds.fetch(interaction.guild?.id ?? '');
	} catch (e) {
		console.error(e);
		await interaction.reply('There was an error adding members to the event specified');
		return;
	}

	await guild.fetch();

	const discordMembers: GuildMember[] =
		method === 'global'
			? iterCollect(
				guild
					.channels
					.cache
					.filter((channel): channel is VoiceChannel => channel.type === 'GUILD_VOICE')
					.mapValues(channel => iterCollect(channel.members.values()))
					.values()
			).flatMap(identity)
			: pipe(
				(value: IterableIterator<GuildMember> | undefined) => Maybe.fromValue(value),
				Maybe.map(iterCollect),
				Maybe.orSome([])
			)(
				(await guild.members.fetch()).get(interaction.user.id)?.voice?.channel?.members.values()
			)

	if (discordMembers.length === 0) {
		return await interaction.reply('Could not find any members to record attendance for');
	}

	console.log(discordMembers.length);

	const { schema, session } = await getXSession(conf, mysqlClient);

	const backend = getDiscordBackend(schema);

	try {
		const account = await getAccount(schema)(guild.id);

		if (!account.hasValue) {
			await interaction.reply('There was an unknown error');
			return;
		}

		const maybeAdder = interaction.user ? await getMember(schema)(interaction.user) : Maybe.none();

		if (!maybeAdder.hasValue) {
			await interaction.reply('You are not a certified member');
			return;
		}

		const memberEither = await backend.getMember(account.value)(maybeAdder.value.member);

		if (Either.isLeft(memberEither)) {
			console.error(memberEither.value);

			await interaction.reply('Could not get member information or permissions');
			return;
		}

		const adder = memberEither.value;
		let adderUser: User;
		try {
			const permissions = await backend
				.getPermissionsForMemberInAccount(account.value)(adder)
				.map(PAM.getDefaultPermissions(account.value))
				.fullJoin();

			console.log(adder, permissions)

			adderUser = {
				...adder,
				sessionID: '',
				permissions,
			};
		} catch (e) {
			console.error(e);

			await interaction.reply('Could not get member information or permissions');
			return;
		}

		const eventEither = await backend
			.getEvent(account.value)(eventID)
			.flatMap(backend.ensureResolvedEvent);

		if (Either.isLeft(eventEither)) {
			console.error(eventEither.value);

			await interaction.reply('Could not get event');
			return;
		}

		const event = eventEither.value;

		const teamMaybe = await (event.teamID !== null && event.teamID !== undefined
			? backend.getTeam(account.value)(event.teamID).map(Maybe.some)
			: asyncRight(Maybe.none(), errorGenerator('Could not get team information'))
		)
			.fullJoin()
			.catch(Maybe.none);

		if (!hasBasicAttendanceManagementPermission(adderUser)(event)(teamMaybe)) {
			await interaction.reply(
				'You do not have permission to add members to attendance of this event',
			);
			return;
		}

		const members = await collectGeneratorAsync(
			asyncIterMap(toCAPUnit(backend)(account.value))(discordMembers),
		);

		const solidMembers = members
			.filter(Either.isRight)
			.map(get('value'))
			.filter(Maybe.isSome)
			.map(get('value'));

		const attendanceEither = await backend
			.getAttendanceForEvent(event)
			.map(collectGeneratorAsync);

		if (Either.isLeft(attendanceEither)) {
			await interaction.reply('There was an issue getting event attendance');
			return;
		}

		const attendanceIDs = attendanceEither.value.map(get('memberID'));

		let membersAddedCount = 0,
			membersDuplicate = 0;

		for (const member of solidMembers) {
			if (attendanceIDs.some(areMembersTheSame(member))) {
				console.log(`${getFullMemberName(member)} is already in attendance, skipping`);
				membersDuplicate++;
				continue;
			}

			const result = await backend.addMemberToAttendance(event)(true)({
				shiftTime: {
					arrivalTime: event.startDateTime,
					departureTime: event.endDateTime,
				},
				comments: `Added by Discord bot by ${getFullMemberName(
					adder,
				)} on ${new Date().toLocaleString()}`,
				customAttendanceFieldValues: [],
				memberID: toReference(member),
				planToUseCAPTransportation: false,
				status: AttendanceStatus.COMMITTEDATTENDED,
			});

			if (
				Either.isLeft(result) &&
				result.value.message === 'Member is already in attendance'
			) {
				console.log(`${getFullMemberName(member)} is already in attendance, skipping`);
				membersDuplicate++;
			} else if (Either.isLeft(result)) {
				console.error(result);
			} else {
				membersAddedCount++;
			}
		}

		const extraMsg =
			membersAddedCount !== solidMembers.length && membersDuplicate !== 0
				? ` (${membersDuplicate} already were added, ${
						solidMembers.length - (membersDuplicate + membersAddedCount)
				  } failed to be added)`
				: membersDuplicate === 0
				? ` (${
						solidMembers.length - (membersDuplicate + membersAddedCount)
				  } failed to be added)`
				: ` (${membersDuplicate} already were added)`;

		await interaction.reply(
			`Added ${membersAddedCount} to attendance of '${event.name}'${extraMsg}`,
		);
	} finally {
		await session.close();
	}
};
