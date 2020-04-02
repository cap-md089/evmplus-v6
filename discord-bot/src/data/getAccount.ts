import { Schema } from '@mysql/xdevapi';
import { just, none, RawAccountObject } from 'common-lib';
import { Account, collectResults, findAndBind } from '../lib/internals';

export default (schema: Schema) => async (serverID: string) => {
	const collection = schema.getCollection<RawAccountObject>('Accounts');

	const results = await collectResults(
		// @ts-ignore
		findAndBind(collection, { discordServer: { hasValue: true, value: { serverID } } })
	);

	if (results.length !== 1) {
		return none<Account>();
	}

	const a = results[0] as RawAccountObject;

	return just(await Account.Get(a.id, schema));
};
