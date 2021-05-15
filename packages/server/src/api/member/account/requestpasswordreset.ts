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

import { ServerEither } from 'auto-client-api';
import {
	AccountObject,
	api,
	AsyncEither,
	asyncLeft,
	asyncRight,
	Either,
	errorGenerator,
	getFullMemberName,
	getMemberEmail,
	Maybe,
	Member,
	RegistryValues,
	SafeUserAccountInformation,
	ServerError,
	Some,
} from 'common-lib';
import {
	Backends,
	BasicAccountRequest,
	combineBackends,
	EmailBackend,
	EmailSetup,
	getCombinedMemberBackend,
	getEmailBackend,
	getRegistryBackend,
	MemberBackend,
	PAM,
	RegistryBackend,
	SUPPORT_BCC_ADDRESS,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const setupEmail = (member: Member) => (email: string) => (token: string): EmailSetup => ({
	url,
}) => ({
	to: [email],
	bccAddresses: [SUPPORT_BCC_ADDRESS],
	subject: `Password reset for ${getFullMemberName(member)}`,
	htmlBody: `We have deteced that a password reset was requested for you, ${getFullMemberName(
		member,
	)}. \
If you did not request this action, you can safely ignore this email. \
<a href="${url}/finishpasswordreset/${token}">Go here</a> to reset your password. \
This link will expire within 24 hours.`,
	textBody: `We have deteced that a password reset was requested for you, ${getFullMemberName(
		member,
	)}. \
If you did not request this action, you can safely ignore this email. \
This link will expire within 24 hours.\n\nLink: ${url}/finishpasswordreset/${token}`,
});

const getMemberAndSendEmail = (
	backend: Backends<[EmailBackend, MemberBackend, RegistryBackend]>,
) => (account: AccountObject) => (userAccount: SafeUserAccountInformation) => (
	token: string,
): ServerEither<void> =>
	backend
		.getMember(account)(userAccount.member)
		.flatMap(member =>
			Maybe.cata<string, AsyncEither<ServerError, void>>(() =>
				asyncLeft<ServerError, void>({
					type: 'OTHER',
					code: 400,
					message: 'Member does not have an email',
				}),
			)(email =>
				backend
					.getRegistry(account)
					.map(backend.sendEmail)
					.flatApply(setupEmail(member)(email)(token)),
			)(getMemberEmail(member.contact)),
		);

export const func: Endpoint<
	Backends<[PAM.PAMBackend, MemberBackend, EmailBackend, RegistryBackend]>,
	api.member.account.PasswordResetRequest
> = backend => req =>
	asyncRight(req, errorGenerator('Could not request username'))
		.filter(() => backend.verifyCaptcha(req.body.captchaToken), {
			type: 'OTHER',
			code: 400,
			message: 'Could not verify reCAPTCHA',
		})
		.flatMap(() =>
			AsyncEither.All([
				backend
					.getUserInformationForUser(req.body.username)
					.map(Maybe.map(PAM.simplifyUserInformation)),
				backend.getRegistry(req.account),
			]),
		)
		.filter(
			(info): info is [Some<SafeUserAccountInformation>, RegistryValues] =>
				Maybe.isSome(info[0]),
			{
				type: 'OTHER',
				code: 400,
				message: 'There is no account with that username',
			},
		)
		.flatMap(([account, _]) =>
			backend
				.createPasswordResetToken(account.value.username)
				.flatMap(getMemberAndSendEmail(backend)(req.account)(account.value)),
		)
		.leftFlatMap(err =>
			err.message === 'There is no account with that username'
				? Either.right(void 0)
				: Either.left(err),
		)
		.map(wrapper);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[RegistryBackend, MemberBackend, EmailBackend, PAM.PAMBackend]
	>(getRegistryBackend, getCombinedMemberBackend(), getEmailBackend, PAM.getPAMBackend),
);
