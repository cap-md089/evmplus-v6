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

import { Schema } from '@mysql/xdevapi';
import { DiscordAccount, Maybe, MaybeObj } from 'common-lib';
import { GuildMember, User } from 'discord.js';
import { collectResults, findAndBind } from 'server-common';

export default (schema: Schema) => async (
	member: GuildMember | User,
): Promise<MaybeObj<DiscordAccount>> => {
	const collection = schema.getCollection<DiscordAccount>('DiscordAccounts');

	const results = await collectResults(findAndBind(collection, { discordID: member.id }));

	if (results.length !== 1) {
		return Maybe.none();
	}

	return Maybe.some(results[0]);
};
