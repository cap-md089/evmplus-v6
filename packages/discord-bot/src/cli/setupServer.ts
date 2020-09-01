import { Client } from 'discord.js';
import * as mysql from '@mysql/xdevapi';
import { ServerConfiguration } from 'common-lib';
import { setupCAPServer } from '../data/setupDiscordServer';

export default async (
	mysqlClient: mysql.Client,
	conf: ServerConfiguration,
	client: Client,
	args: string[],
) => {
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
