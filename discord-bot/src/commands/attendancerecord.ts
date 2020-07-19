import * as mysql from '@mysql/xdevapi';
import {
	areMembersTheSame,
	AsyncEither,
	asyncIterMap,
	AttendanceStatus,
	collectGeneratorAsync,
	effectiveManageEventPermissionForEvent,
	Either,
	get,
	getFullMemberName,
	Maybe,
	Permissions,
	ServerConfiguration,
	toReference,
	User,
} from 'common-lib';
import { Client, Message, VoiceChannel } from 'discord.js';
import {
	addMemberToAttendance,
	getAttendanceForEvent,
	getEvent,
	getFullPointsOfContact,
	resolveReference,
} from 'server-common';
import { getPermissionsForMemberInAccountDefault } from 'server-common/dist/member/pam';
import { getXSession } from '..';
import { toCAPUnit } from '../data/convertMember';
import getAccount from '../data/getAccount';
import getMember from '../data/getMember';

export default (client: Client) => (mysqlConn: mysql.Client) => (conf: ServerConfiguration) => (
	parts: string[]
) => async (message: Message) => {
	if (parts.length < 3) {
		await message.reply(
			'Attendance records needs an event ID and a method for selecting members to record; either "global" or "withme" (defaults to global)'
		);
		await message.channel.send('For example:');
		await message.channel.send(`<@!${client.user.id}> attendancerecord 1 global`);
		await message.channel.send(`<@!${client.user.id}> attendancerecord 2 withme`);
		return;
	}

	const eventID = parseInt(parts[2], 10);

	if (isNaN(eventID)) {
		await message.channel.send('Event ID has to be a number');
		return;
	}

	const method = parts[3] ?? 'global';

	const discordMembers =
		method === 'global'
			? message.guild.channels
					.filter((v) => v.type === 'voice')
					.array()
					.flatMap((channel) => (channel as VoiceChannel).members.array())
			: method === 'withme'
			? message.member.voiceChannel?.members.array()
			: undefined;

	if (!discordMembers) {
		await message.reply(`Unknown member group: "${method}"`);
		await message.channel.send('Known member groups are "withme" or "global"');
		return;
	}

	const { schema, session } = await getXSession(conf, mysqlConn);

	const account = await getAccount(schema)(message.guild.id);

	if (!account.hasValue) {
		await message.channel.send('There was an unknown error');

		await session.close();
		return;
	}

	const maybeAdder = await getMember(schema)(message.member);

	if (!maybeAdder.hasValue) {
		await message.channel.send('You are not a certified member');

		await session.close();
		return;
	}

	const memberEither = await resolveReference(schema)(account.value)(maybeAdder.value.member);

	if (Either.isLeft(memberEither)) {
		console.error(memberEither.value);

		await session.close();
		await message.channel.send('Could not get member information or permissions');

		return;
	}

	const adder = memberEither.value;
	let adderUser: User;
	try {
		const permissions = await getPermissionsForMemberInAccountDefault(
			schema,
			toReference(adder),
			account.value
		);

		adderUser = {
			...adder,
			sessionID: '',
			permissions,
		};
	} catch (e) {
		console.error(e);

		await session.close();
		message.channel.send('Could not get member information or permissions');
		return;
	}

	const eventEither = await getEvent(schema)(account.value)(eventID);

	if (Either.isLeft(eventEither)) {
		console.error(eventEither.value);

		await session.close();
		await message.channel.send('Could not get event');
		return;
	}

	const event = eventEither.value;

	if (effectiveManageEventPermissionForEvent(adderUser)(event) === Permissions.ManageEvent.NONE) {
		await session.close();
		await message.reply(
			'You do not have permission to add members to attendance of this event'
		);
		return;
	}

	const members = await collectGeneratorAsync(
		asyncIterMap(toCAPUnit(schema)(account.value))(discordMembers)
	);

	const solidMembers = members
		.filter(Either.isRight)
		.map(get('value'))
		.filter(Maybe.isSome)
		.map(get('value'));

	await message.channel.send('Looking to add ' + members.length + ' members');

	const fullInfoEither = await AsyncEither.All([
		getAttendanceForEvent(schema)(event).map(collectGeneratorAsync),
		getFullPointsOfContact(schema)(account.value)(event.pointsOfContact),
	]);

	if (Either.isLeft(fullInfoEither)) {
		await session.close();
		return message.channel.send('There was an issue getting event attendance');
	}

	const [attendance, pointsOfContact] = fullInfoEither.value;
	const attendanceIDs = attendance.map(get('memberID'));

	let membersAddedCount = 0,
		membersDuplicate = 0;

	for (const member of solidMembers) {
		if (attendanceIDs.some(areMembersTheSame(member))) {
			console.log(`${getFullMemberName(member)} is already in attendance, skipping`);
			membersDuplicate++;
			return;
		}

		const result = await addMemberToAttendance(schema)(account.value)({
			...event,
			attendance,
			pointsOfContact,
		})({
			shiftTime: {
				arrivalTime: event.startDateTime,
				departureTime: event.endDateTime,
			},
			comments: `Added by Discord bot by ${getFullMemberName(
				adder
			)} on ${new Date().toLocaleString()}`,
			customAttendanceFieldValues: [],
			memberID: toReference(member),
			planToUseCAPTransportation: false,
			status: AttendanceStatus.COMMITTEDATTENDED,
		});

		if (Either.isLeft(result)) {
			console.log(result);
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

	await message.reply(`Added ${membersAddedCount} to attendance of '${event.name}${extraMsg}`);

	await session.close();
};
