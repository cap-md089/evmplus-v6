import { Schema } from '@mysql/xdevapi';
import { DiscordAccount, just, none, NonNullMemberReference } from 'common-lib';
import { collectResults, findAndBind } from '../lib/internals';

export default (schema: Schema) => async (member: NonNullMemberReference) => {
	const collection = schema.getCollection<DiscordAccount>('DiscordAccounts');

	const results = await collectResults(findAndBind(collection, { member }));

	if (results.length !== 1) {
		return none<DiscordAccount>();
	}

	return just(results[0]);
};
