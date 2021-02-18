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
	areMembersTheSame,
	AsyncEither,
	asyncIterMap,
	asyncRight,
	AttendanceStatus,
	collectGeneratorAsync,
	Either,
	errorGenerator,
	get,
	getFullMemberName,
	hasBasicAttendanceManagementPermission,
	Maybe,
	toReference,
	User,
} from 'common-lib';
import { Client, GuildMember, Message, VoiceChannel } from 'discord.js';
import {
	addMemberToAttendance,
	ensureResolvedEvent,
	getAttendanceForEvent,
	getEvent,
	getFullPointsOfContact,
	getTeam,
	PAM,
	resolveReference,
} from 'server-common';
import { getXSession } from '..';
import { toCAPUnit } from '../data/convertMember';
import getAccount from '../data/getAccount';
import getMember from '../data/getMember';
import { DiscordCLIConfiguration } from '../getDiscordConf';
import * as debug from 'debug';

const logFunc = debug('discord-bot:commands:attendancerecord');

export default (client: Client) => (mysqlConn: mysql.Client) => (conf: DiscordCLIConfiguration) => (
	parts: string[],
) => async (message: Message) => {
	if (parts.length < 3) {
		await message.reply(
			'Attendance records needs an event ID and a method for selecting members to record; either "global" or "withme" (defaults to global)',
		);
		await message.channel.send('For example:');
		await message.channel.send(
			`<@!${client.user?.id ?? '572536606573985794'}> attendancerecord 1 global`,
		);
		await message.channel.send(
			`<@!${client.user?.id ?? '572536606573985794'}> attendancerecord 2 withme`,
		);
		return;
	}

	const eventID = parseInt(parts[2], 10);

	if (isNaN(eventID)) {
		return await message.channel.send('Event ID has to be a number');
	}

	const method = parts[3] ?? 'global';

	let guild;
	try {
		guild = await client.guilds.fetch(message.guild?.id ?? '');
	} catch (e) {
		console.error(e);
		return await message.reply('There was an error adding members to the event specified');
	}

	await guild.fetch();

	const discordMembers: GuildMember[] | undefined =
		method === 'global'
			? guild.channels.cache
					.array()
					.filter((v): v is VoiceChannel => v.type === 'voice')
					.flatMap(channel => channel.members.array())
			: method === 'withme'
			? message.member?.voice?.channel?.members.array()
			: undefined;

	logFunc(
		'Got voice channel members',
		discordMembers?.map(mem => mem.nickname),
	);

	if (!discordMembers && method === 'withme') {
		await message.reply('There was a problem getting the voice channel you are in');
		await message.reply('Please try again later or use "global"');
		return;
	} else if (!discordMembers) {
		await message.reply(`Unknown member group: "${method}"`);
		await message.channel.send('Known member groups are "withme" or "global"');
		return;
	}

	const { schema, session } = await getXSession(conf, mysqlConn);

	try {
		logFunc('Getting account info for ', guild.id);
		const account = await getAccount(schema)(guild.id);
		logFunc('Got account info', account);

		if (!account.hasValue) {
			return await message.channel.send('There was an unknown error');
		}

		const maybeAdder = message.member ? await getMember(schema)(message.member) : Maybe.none();

		if (!maybeAdder.hasValue) {
			return await message.channel.send('You are not a certified member');
		}

		const memberEither = await resolveReference(schema)(account.value)(maybeAdder.value.member);

		if (Either.isLeft(memberEither)) {
			console.error(memberEither.value);

			return await message.channel.send('Could not get member information or permissions');
		}

		const adder = memberEither.value;
		let adderUser: User;
		try {
			const permissions = await PAM.getPermissionsForMemberInAccountDefault(
				schema,
				toReference(adder),
				account.value,
			);

			adderUser = {
				...adder,
				sessionID: '',
				permissions,
			};
		} catch (e) {
			console.error(e);

			return await message.channel.send('Could not get member information or permissions');
		}

		const eventEither = await getEvent(schema)(account.value)(eventID).flatMap(
			ensureResolvedEvent(schema),
		);

		if (Either.isLeft(eventEither)) {
			console.error(eventEither.value);

			return await message.channel.send('Could not get event');
		}

		const event = eventEither.value;

		const teamMaybe = await (event.teamID !== null && event.teamID !== undefined
			? getTeam(schema)(account.value)(event.teamID).map(Maybe.some)
			: asyncRight(Maybe.none(), errorGenerator('Could not get team information'))
		)
			.fullJoin()
			.catch(Maybe.none);

		if (!hasBasicAttendanceManagementPermission(adderUser)(event)(teamMaybe)) {
			return await message.reply(
				'You do not have permission to add members to attendance of this event',
			);
		}

		const members = await collectGeneratorAsync(
			asyncIterMap(toCAPUnit(schema)(account.value))(discordMembers),
		);

		const solidMembers = members
			.filter(Either.isRight)
			.map(get('value'))
			.filter(Maybe.isSome)
			.map(get('value'));

		await message.channel.send('Looking to add ' + solidMembers.length + ' members');

		const fullInfoEither = await AsyncEither.All([
			getAttendanceForEvent(schema)(account)(event).map(collectGeneratorAsync),
			getFullPointsOfContact(schema)(account.value)(event.pointsOfContact),
		]);

		if (Either.isLeft(fullInfoEither)) {
			return await message.channel.send('There was an issue getting event attendance');
		}

		const [attendance, pointsOfContact] = fullInfoEither.value;
		const attendanceIDs = attendance.map(get('memberID'));

		let membersAddedCount = 0,
			membersDuplicate = 0;

		for (const member of solidMembers) {
			if (attendanceIDs.some(areMembersTheSame(member))) {
				console.log(`${getFullMemberName(member)} is already in attendance, skipping`);
				membersDuplicate++;
				continue;
			}

			const result = await addMemberToAttendance(schema)(account.value)({
				...event,
				attendance,
				pointsOfContact,
			})(true)({
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

			if (Either.isLeft(result)) {
				console.error(result);
			} else {
				membersAddedCount++;
			}
		}

		const extraMsg =
			membersAddedCount !== solidMembers.length && membersDuplicate !== 0
				? ` (${membersDuplicate} already were added, ${solidMembers.length -
						(membersDuplicate + membersAddedCount)} failed to be added)`
				: membersDuplicate === 0
				? ` (${solidMembers.length -
						(membersDuplicate + membersAddedCount)} failed to be added)`
				: ` (${membersDuplicate} already were added)`;

		await message.reply(
			`Added ${membersAddedCount} to attendance of '${event.name}${extraMsg}`,
		);
	} finally {
		await session.close();
	}
};
