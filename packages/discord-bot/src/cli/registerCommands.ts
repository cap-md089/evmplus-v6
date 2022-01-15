// Copyright (C) 2022 Andrew Rioux, Maximillian Gammache
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import * as mysql from '@mysql/xdevapi';
import { Client } from 'discord.js';
import * as fetch from 'node-fetch';
import { DiscordCLIConfiguration } from '../getDiscordConf';

//  /attendancerecord 1

const commandSetup = {
    name: "attendancerecord",
    type: 1,
    description: "Add a bunch of attendees to an event",
    options: [
        {
            name: "eventid",
            description: "The event to add attendees to",
            type: 4,
            required: true
        },
        {
            name: "target",
            description: "Where to look to add people",
            type: 3,
            required: false,
            choices: [
                {
                    name: "Everyone in a voice channel right now",
                    value: "global"
                },
                {
                    name: "Everyone in the same voice channel as me",
                    value: "withme"
                }
            ]
        }
    ]
}

export default async (
	mysqlClient: mysql.Client,
	conf: DiscordCLIConfiguration,
	client: Client,
	args: string[],
): Promise<void> => {
    const clientId = (await client.application?.fetch())?.id;

    if (!clientId) {
        throw new Error('Could not get client ID');
    }

	if (process.env.NODE_ENV === 'development') {
        if (args.length < 1) {
            throw new Error('Please specify development Guild ID');
        }

        const guildId = args[0];

        const result = await fetch.default(`https://discord.com/api/v8/applications/${clientId}/guilds/${guildId}/commands`, {
            method: 'POST',
            body: JSON.stringify(commandSetup),
            headers: {
                Authorization: `Bot ${conf.DISCORD_CLIENT_TOKEN}`,
                ['content-type']: 'application/json'
            }
        });

        console.log(JSON.stringify(await result.json(), null, 4));
	} else {
        const result = await fetch.default(`https://discord.com/api/v8/applications/${clientId}/commands`, {
            method: 'POST',
            body: JSON.stringify(commandSetup),
            headers: {
                Authorization: `Bot ${conf.DISCORD_CLIENT_TOKEN}`,
                ['content-type']: 'application/json'
            }
        });

        console.log(JSON.stringify(await result.json(), null, 4));
	}
};
