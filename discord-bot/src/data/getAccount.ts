import { Schema } from '@mysql/xdevapi';
import { AccountObject, Maybe, MaybeObj } from 'common-lib';
import { collectResults, findAndBind } from 'server-common';

export default (schema: Schema) => async (serverID: string): Promise<MaybeObj<AccountObject>> => {
	const collection = schema.getCollection<AccountObject>('Accounts');

	const results = await collectResults<AccountObject>(
		// @ts-ignore
		findAndBind(collection, { discordServer: { hasValue: true, value: { serverID } } })
	);

	if (results.length !== 1) {
		return Maybe.none();
	}

	return Maybe.some(results[0]);
};
