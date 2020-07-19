import { Schema } from '@mysql/xdevapi';
import { DiscordAccount, MemberReference, Maybe } from 'common-lib';
import { findAndBind, collectResults } from 'server-common';

export default (schema: Schema) => async (member: MemberReference) => {
	const collection = schema.getCollection<DiscordAccount>('DiscordAccounts');

	const results = await collectResults(findAndBind(collection, { member }));

	if (results.length !== 1) {
		return Maybe.none();
	}

	return Maybe.some(results[0]);
};
