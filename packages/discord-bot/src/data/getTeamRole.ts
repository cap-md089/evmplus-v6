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

import { Guild, Role, Permissions } from 'discord.js';
import { RawTeamObject, MaybeObj, Maybe as M } from 'common-lib';
import { byName } from './setupUser';

const renderTeamName = (team: RawTeamObject) =>
	team.name.toLowerCase().includes('team') ? team.name : `${team.name} Team`;

export const getOrCreateTeamRolesForTeam = (guild: Guild) => async (
	team: RawTeamObject,
): Promise<[MaybeObj<Role>, MaybeObj<Role>, MaybeObj<Role>]> => {
	const genericTeamMemberRole = M.fromValue(guild.roles.find(byName('Team Member')));

	const permissions = new Permissions(Permissions.DEFAULT)
		.remove(Permissions.FLAGS.CHANGE_NICKNAME!)
		.remove(Permissions.FLAGS.CREATE_INSTANT_INVITE!);

	let teamLeaderRole = M.fromValue(guild.roles.find(byName(`Team Lead - ${team.name}`)));

	if (!teamLeaderRole.hasValue) {
		const position = Math.min(
			M.orSome(Number.POSITIVE_INFINITY)(
				M.map<Role, number>(r => r.position)(
					M.fromValue(guild.roles.find(byName('Team Member'))),
				),
			),
			guild.roles
				.filter(role => role.name.toLowerCase().includes('team lead'))
				.map(role => role.position)
				.reduce((prev, curr) => Math.min(prev, curr), Number.POSITIVE_INFINITY),
		);

		teamLeaderRole = M.some(
			await guild.createRole({
				color: [241, 196, 15],
				hoist: false,
				mentionable: false,
				name: `Team Lead - ${team.name}`,
				position,
				permissions,
			}),
		);
	}

	let teamMemberRole = M.fromValue(guild.roles.find(byName(renderTeamName(team))));

	if (!teamMemberRole.hasValue) {
		const position = Math.min(
			M.orSome(Number.POSITIVE_INFINITY)(
				M.map<Role, number>(r => r.position)(
					M.fromValue(guild.roles.find(byName('Team Member'))),
				),
			),
			guild.roles
				.filter(
					role =>
						role.name.toLowerCase().includes('team') &&
						!role.hexColor.toLowerCase().endsWith('71368a'),
				)
				.map(role => role.position)
				.reduce((prev, curr) => Math.min(prev, curr), Number.POSITIVE_INFINITY),
		);

		teamMemberRole = M.some(
			await guild.createRole({
				color: [194, 124, 14],
				hoist: false,
				mentionable: false,
				name: renderTeamName(team),
				position,
				permissions,
			}),
		);
	}

	return [genericTeamMemberRole, teamLeaderRole, teamMemberRole];
};
