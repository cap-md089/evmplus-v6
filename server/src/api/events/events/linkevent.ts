import { ServerAPIEndpoint } from 'auto-client-api';
import {
	always,
	api,
	AsyncEither,
	asyncRight,
	errorGenerator,
	hasBasicEventPermissions,
	toReference,
	User,
} from 'common-lib';
import { getAccount, getEvent, linkEvent, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.events.events.Link> = req =>
	AsyncEither.All([
		getEvent(req.mysqlx)(req.account)(req.params.eventID),
		getAccount(req.mysqlx)(req.params.targetaccount),
	]).flatMap(([event, targetAccount]) =>
		asyncRight(
			PAM.getPermissionsForMemberInAccountDefault(
				req.mysqlx,
				toReference(req.member),
				targetAccount
			),
			errorGenerator('Could not get permissions for account')
		)
			.map<User>(permissions => ({ ...req.member, permissions }))
			.filter(hasBasicEventPermissions, {
				type: 'OTHER',
				code: 403,
				message:
					'Member does not have permission to perform this action in the specified account',
			})
			.map(always(targetAccount))
			.flatMap(
				linkEvent(req.configuration)(req.mysqlx)(req.account)(event)(
					toReference(req.member)
				)
			)
	);

export default func;
