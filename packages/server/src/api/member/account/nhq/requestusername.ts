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

import {
	AccountObject,
	always,
	api,
	asyncLeft,
	CAPNHQMemberReference,
	Either,
	getFullMemberName,
	getMemberEmail,
	identity,
	Maybe,
	Member,
	pipe,
	SafeUserAccountInformation,
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
	getTimeBackend,
	MemberBackend,
	PAM,
	RegistryBackend,
	ServerEither,
	SYSTEM_BCC_ADDRESS,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../../..';
import wrapper from '../../../../lib/wrapper';

const generateEmail = (memberInfo: Member) => (accountInfo: SafeUserAccountInformation) => (
	email: string,
): EmailSetup => () => ({
	bccAddresses: [SYSTEM_BCC_ADDRESS],
	to: [email],
	subject: 'Username request',
	htmlBody: `${getFullMemberName(memberInfo)}, your login is ${accountInfo.username}.<br />
Please respond to this email if you have questions regarding your EvMPlus.org account.`,
	textBody: `${getFullMemberName(memberInfo)}, your login is ${accountInfo.username}.
Please respond to this email if you have questions regarding your EvMPlus.org account.`,
});

const sendEmailToMember = (backend: Backends<[EmailBackend, RegistryBackend]>) => (
	account: AccountObject,
) => (info: SafeUserAccountInformation<CAPNHQMemberReference>) => (member: Member) => (
	email: string,
): ServerEither<void> =>
	backend
		.getRegistry(account)
		.map(backend.sendEmail)
		.flatApply(generateEmail(member)(info)(email));

export const func: Endpoint<
	Backends<[EmailBackend, PAM.PAMBackend, MemberBackend, RegistryBackend]>,
	api.member.account.capnhq.UsernameRequest
> = backend => req =>
	backend
		.verifyCaptcha(req.body.captchaToken)
		.filter(identity, {
			type: 'OTHER',
			code: 400,
			message: 'Could not verify CAPTCHA token',
		})
		.flatMap(() =>
			backend
				.getUserInformationForMember({
					type: 'CAPNHQMember',
					id: req.body.capid,
				} as CAPNHQMemberReference)
				.map(Maybe.map(PAM.simplifyUserInformation))
				.leftFlatMap(always(Either.right(Maybe.none()))),
		)
		.filter(Maybe.isSome, {
			type: 'OTHER',
			code: 400,
			message: 'Username not found',
		})
		.flatMap(info =>
			backend
				.getMember(req.account)(info.value.member)
				.flatMap(member =>
					pipe(
						Maybe.map<string, ServerEither<void>>(
							sendEmailToMember(backend)(req.account)(info.value)(member),
						),
						Maybe.orSome<ServerEither<void>>(
							asyncLeft({
								type: 'OTHER',
								code: 400,
								message:
									'There is no email address associated with the account requested',
							}),
						),
					)(getMemberEmail(member.contact)),
				),
		)
		.leftFlatMap(err =>
			err.message === 'Username not found' ? Either.right(void 0) : Either.left(err),
		)
		.map(wrapper);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[EmailBackend, MemberBackend, TimeBackend, PAM.PAMBackend, RegistryBackend]
	>(
		getEmailBackend,
		getCombinedMemberBackend(),
		getTimeBackend,
		PAM.getPAMBackend,
		getRegistryBackend,
	),
);
