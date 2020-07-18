import { Collection } from '@mysql/xdevapi';
import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	api,
	asyncRight,
	destroy,
	DiscordAccount,
	errorGenerator,
	SessionType,
	toReference,
} from 'common-lib';
import { collectResults, findAndBind, PAM } from 'server-common';

type Req = ServerAPIRequestParameter<api.member.account.RegisterDiscord>;

const checkForOtherAccounts = (req: Req) => (collection: Collection<DiscordAccount>) =>
	asyncRight(
		Promise.all([
			collectResults(findAndBind(collection, { discordID: req.params.discordID })),
			collectResults(
				findAndBind(collection, {
					member: toReference(req.member),
				})
			),
		]),
		errorGenerator('Could not get Discord accounts')
	).map(res => res[0].length === 0 && res[1].length === 0);

const addToCollection = (req: Req) => (collection: Collection<DiscordAccount>) =>
	collection
		.add({
			discordID: req.params.discordID,
			member: toReference(req.member),
		})
		.execute();

const emitUpdateEvent = (req: Req) => () =>
	req.memberUpdateEmitter.emit('discordRegister', {
		user: {
			discordID: req.params.discordID,
			member: toReference(req.member),
		},
		account: req.account,
	});

const addToCollectionWithCheck = (req: Req) =>
	asyncRight(
		req.mysqlx.getCollection<DiscordAccount>('DiscordAccounts'),
		errorGenerator('Could not get Discord accounts')
	)
		.filter(checkForOtherAccounts(req), {
			type: 'OTHER',
			code: 404,
			message: 'Cannot have more than one Discord account for each CAPUnit.com account',
		})
		.map(addToCollection(req), errorGenerator('Could not add Discord account'))
		.tap(emitUpdateEvent(req));

export const func: ServerAPIEndpoint<api.member.account.RegisterDiscord> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req => addToCollectionWithCheck(req).map(destroy));

export default func;
