import { Schema } from '@mysql/xdevapi';
import { DiscordAccount, Maybe } from 'common-lib';
import { GuildMember } from 'discord.js';
import { collectResults, findAndBind } from 'server-common';

export default (schema: Schema) => async (member: GuildMember) => {
	const collection = schema.getCollection<DiscordAccount>('DiscordAccounts');

	const results = await collectResults(findAndBind(collection, { discordID: member.id }));

	if (results.length !== 1) {
		return Maybe.none();
	}

	return Maybe.some(results[0]);
};
