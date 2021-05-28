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
import { Client } from 'discord.js';
import { setupCAPServer } from '../data/setupDiscordServer';
import { DiscordCLIConfiguration } from '../getDiscordConf';

export default async (
	mysqlClient: mysql.Client,
	conf: DiscordCLIConfiguration,
	client: Client,
	args: string[],
): Promise<void> => {
	if (args.length === 0) {
		throw new Error('Guild ID not provided');
	}

	await setupCAPServer(conf)(mysqlClient)(client)(args[0])({
		deleteOldRoles: false,
		addCACRepresentativeRoles: false,
		addCadetExecutiveStaffRoles: false,
		addCadetLineStaffRoles: false,
		addCadetSquadronCommanderRoles: false,
		addCadetSupportStaffRoles: false,
		// addFlightMemberRoles:  defaults to ones in Registry
		addFlightMemberRoles: [],
		addTeamRoles: false,
		itOfficerAdmin: false,
		addSeniorMemberRoles: false,
		addESRoles: false,
		preserveRoles: ['ALS Commander'],
	});
};
