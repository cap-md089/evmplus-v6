import { Collection } from '@mysql/xdevapi';
import {
	api,
	asyncRight,
	destroy,
	DiscordAccount,
	MemberUpdateEventEmitter,
	none
} from 'common-lib';
import {
	Account,
	asyncEitherHandler2,
	BasicMemberRequest,
	collectResults,
	findAndBind,
	memberRequestTransformer,
	serverErrorGenerator,
	SessionType
} from '../../../lib/internals';
import { tokenTransformer } from '../../formtoken';

const checkForOtherAccounts = (req: BasicMemberRequest<{ discordID: string }>) => (
	collection: Collection<DiscordAccount>
) =>
	asyncRight(
		Promise.all([
			collectResults(findAndBind(collection, { discordID: req.params.discordID })),
			collectResults(
				findAndBind(collection, {
					member: req.member.getReference()
				})
			)
		]),
		serverErrorGenerator('Could not get Discord accounts')
	).map(res => res[0].length === 0 || res[1].length === 0);

const addToCollection = (req: BasicMemberRequest<{ discordID: string }>) => (
	collection: Collection<DiscordAccount>
) =>
	collection
		.add({
			discordID: req.params.discordID,
			member: req.member.getReference()
		})
		.execute();

const emitUpdateEvent = (emitter: MemberUpdateEventEmitter) => (
	req: BasicMemberRequest<{ discordID: string }>
) => () =>
	emitter.emit('discordRegister', {
		user: {
			discordID: req.params.discordID,
			member: req.member.getReference()
		},
		account: req.account.toRaw()
	});

const addToCollectionWithCheck = (emitter: MemberUpdateEventEmitter) => (
	req: BasicMemberRequest<{ discordID: string }>
) =>
	asyncRight(
		req.mysqlx.getCollection<DiscordAccount>('DiscordAccounts'),
		serverErrorGenerator('Could not get Discord accounts')
	)
		.filter(checkForOtherAccounts(req), {
			code: 404,
			message: 'Cannot have more than one Discord account for each CAPUnit.com account',
			error: none<Error>()
		})
		.map(addToCollection(req), serverErrorGenerator('Could not add Discord account'))
		.tap(emitUpdateEvent(emitter)(req));

export default (emitter: MemberUpdateEventEmitter) =>
	asyncEitherHandler2<api.member.account.RegisterDiscord, { discordID: string }>(request =>
		asyncRight(request, serverErrorGenerator('Could not handle request'))
			.flatMap(Account.RequestTransformer)
			.flatMap(memberRequestTransformer(SessionType.REGULAR, true))
			.flatMap(tokenTransformer)
			.flatMap(addToCollectionWithCheck(emitter))
			.map(destroy)
	);
