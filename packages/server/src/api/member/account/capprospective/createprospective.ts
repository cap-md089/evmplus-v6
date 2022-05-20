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

import { ServerAPIRequestParameter, ServerEither, validator } from 'auto-client-api';
import {
	AccountType,
	api,
	APIEndpointBody,
	AsyncEither,
	asyncLeft,
	asyncRight,
	CAPMemberContact,
	CAPProspectiveMemberPasswordCreation,
	CAPProspectiveMemberPasswordCreationType,
	destroy,
	errorGenerator,
	getFullMemberName,
	getMemberEmail,
	Maybe,
	NewCAPProspectiveMember,
	Permissions,
	RawCAPProspectiveMemberObject,
	RawCAPSquadronAccountObject,
	SessionType,
	toReference,
	Validator,
} from 'common-lib';
import {
	AccountBackend,
	Backends,
	BasicAccountRequest,
	CAP,
	combineBackends,
	EmailBackend,
	EmailParameters,
	EmailToSend,
	getAccountBackend,
	getCombinedTeamsBackend,
	getEmailBackend,
	getMemberBackend,
	getRandomBackend,
	getRegistryBackend,
	getTimeBackend,
	MemberBackend,
	PAM,
	RandomBackend,
	RegistryBackend,
	SYSTEM_BCC_ADDRESS,
	TeamsBackend,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../../..';
import { validateRequest } from '../../../../lib/requestUtils';
import wrapper from '../../../../lib/wrapper';

type Req = ServerAPIRequestParameter<api.member.account.capprospective.CreateProspectiveAccount>;

const generateLinkEmail = (token: string) => (member: RawCAPProspectiveMemberObject) => (
	to: string,
) => ({ url }: EmailParameters): EmailToSend => ({
	to: [to],
	bccAddresses: [SYSTEM_BCC_ADDRESS],
	subject: 'Finish Event Manager Account Creation',
	htmlBody: `
<h2>You're almost there ${getFullMemberName(member)}!</h2>
<p>To complete your Event Manager account creation, click or visit the link below:</p>
<p>
	<a href="${url}/finishaccount/${token}/">Confirm account creation</a>
</p>
<h4>Please respond to this email if you have any questions.</h4>
`,
	textBody: `
You're almost there ${getFullMemberName(member)}!

To complete your Event Manager account creation, copy and paste the link below into a web browser:

${url}/finishaccount/${token}/

Please respond to this email if you have any questions
`,
});

const generateRandomPasswordEmail = ([username, password]: [
	username: string,
	password: string,
]) => (member: RawCAPProspectiveMemberObject) => (to: string) => ({
	url,
}: EmailParameters): EmailToSend => ({
	to: [to],
	bccAddresses: [SYSTEM_BCC_ADDRESS],
	subject: 'Finish Event Manager Account Registration',
	htmlBody: `
<h4>Your account has been created, ${getFullMemberName(member)}!</h4>
<p>
	You can now <a href="${url}/signin?returnurl=%2F">
		sign in
	</a> with the username ${username} and the password <b>${password}</b>.
</p>`,
	textBody: `
Your account has been created, ${getFullMemberName(member)}!

You can now sign in with the username ${username} and the password ${password}.

Sign in with the link below:
${url}/signin?returnurl=%2F
`,
});

const sendPasswordLink = (backend: Backends<[EmailBackend, RegistryBackend, PAM.PAMBackend]>) => (
	req: Req,
) => (member: RawCAPProspectiveMemberObject) =>
	Maybe.cata<string, ServerEither<string>>(() =>
		asyncLeft({
			type: 'OTHER',
			code: 400,
			message: 'Cannot have a link emailed if there is no email provided',
		}),
	)(email => asyncRight(email, errorGenerator('Could not set password link')))(
		getMemberEmail(member.contact),
	).flatMap(email =>
		AsyncEither.All([
			backend.getRegistry(req.account),
			backend.addUserAccountCreationToken(member),
		]).flatMap(([registry, token]) =>
			backend.sendEmail(registry)(generateLinkEmail(token)(member)(email)),
		),
	);

const createWithPassword = (backend: Backends<[PAM.PAMBackend, AccountBackend]>) => (
	username: string,
) => (password: string) => (member: RawCAPProspectiveMemberObject) =>
	AsyncEither.All([
		backend.addUserAccountCreationToken(member),
		backend.getAccount(member.accountID),
	])
		.map(([token, account]) =>
			backend.addUserAccount(account)(member)([username, password])(token),
		)
		.map(destroy);

const createWithRandomPassword = (
	backend: Backends<[RandomBackend, EmailBackend, PAM.PAMBackend, RegistryBackend]>,
) => (req: Req) => (username: string) => (member: RawCAPProspectiveMemberObject) =>
	Maybe.cata<string, ServerEither<string>>(() =>
		asyncLeft({
			type: 'OTHER',
			code: 400,
			message: 'Cannot have a link emailed if there is no email provided',
		}),
	)(email => asyncRight(email, errorGenerator('Could not set password link')))(
		getMemberEmail(member.contact),
	).flatMap(email =>
		AsyncEither.All([
			backend.getRegistry(req.account),
			backend.addUserAccountCreationToken(member),
			backend.randomBytes(10).map(buffer => buffer.toString('base64')),
		])
			.tap(([_, token, password]) =>
				backend.addUserAccount(req.account)(toReference(member))([username, password])(
					token,
				),
			)
			.flatMap(([registry, _, password]) =>
				backend.sendEmail(registry)(
					generateRandomPasswordEmail([username, password])(member)(email),
				),
			),
	);

const newProspectiveMemberAccountValidator = new Validator<
	APIEndpointBody<api.member.account.capprospective.CreateProspectiveAccount>
>({
	login: validator<CAPProspectiveMemberPasswordCreation>(Validator),
	member: new Validator<NewCAPProspectiveMember>({
		contact: validator<CAPMemberContact>(Validator),
		flight: validator<string | null>(Validator),
		nameFirst: Validator.String,
		nameLast: Validator.String,
		nameMiddle: Validator.String,
		nameSuffix: Validator.String,
		seniorMember: Validator.Boolean,
	}),
});

export const func: Endpoint<
	Backends<
		[
			AccountBackend,
			RandomBackend,
			EmailBackend,
			RegistryBackend,
			MemberBackend,
			CAP.CAPMemberBackend,
			PAM.PAMBackend,
		]
	>,
	api.member.account.capprospective.CreateProspectiveAccount
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresPermission(
			'ProspectiveMemberManagement',
			Permissions.ProspectiveMemberManagement.FULL,
		)(request =>
			validateRequest(newProspectiveMemberAccountValidator)(request)
				.flatMap(req =>
					asyncRight(req.account, errorGenerator('Could not create prospective member'))
						.filter(
							(account): account is RawCAPSquadronAccountObject =>
								account.type === AccountType.CAPSQUADRON,
							{
								type: 'OTHER',
								code: 400,
								message:
									'CAP Prospective member accounts may only be created for a CAP Squadron account',
							},
						)
						.map(backend.createProspectiveMember)
						.flatApply(req.body.member)
						.flatMap(
							req.body.login.type ===
								CAPProspectiveMemberPasswordCreationType.EMAILLINK
								? sendPasswordLink(backend)(req)
								: req.body.login.type ===
								  CAPProspectiveMemberPasswordCreationType.RANDOMPASSWORD
								? createWithRandomPassword(backend)(req)(req.body.login.username)
								: createWithPassword(backend)(req.body.login.username)(
										req.body.login.password,
								  ),
						),
				)
				.map(wrapper),
		),
	);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[
			AccountBackend,
			RandomBackend,
			EmailBackend,
			RegistryBackend,
			CAP.CAPMemberBackend,
			TeamsBackend,
			MemberBackend,
			TimeBackend,
			PAM.PAMBackend,
		]
	>(
		getAccountBackend,
		getRandomBackend,
		getEmailBackend,
		getRegistryBackend,
		CAP.getCAPMemberBackend,
		getCombinedTeamsBackend(),
		getMemberBackend,
		getTimeBackend,
		PAM.getPAMBackend,
	),
);
