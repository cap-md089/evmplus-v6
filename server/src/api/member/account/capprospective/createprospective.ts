/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	ServerAPIEndpoint,
	ServerAPIRequestParameter,
	ServerEither,
	validator,
} from 'auto-client-api';
import {
	AccountType,
	api,
	APIEndpointBody,
	AsyncEither,
	asyncLeft,
	asyncRight,
	call,
	CAPMemberContact,
	CAPProspectiveMemberPasswordCreation,
	CAPProspectiveMemberPasswordCreationType,
	destroy,
	errorGenerator,
	getFullMemberName,
	getMemberEmail,
	Maybe,
	NewCAPProspectiveMember,
	RawCAPProspectiveMemberObject,
	RawCAPSquadronAccountObject,
	SessionType,
	toReference,
	Validator,
} from 'common-lib';
import { randomBytes } from 'crypto';
import { CAP, getRegistry, PAM, sendEmail } from 'server-common';
import { promisify } from 'util';
import { validateRequest } from '../../../../lib/requestUtils';

type Req = ServerAPIRequestParameter<api.member.account.capprospective.CreateProspectiveAccount>;

const sendPasswordLink = (emailFunction: typeof sendEmail) => (req: Req) => (
	member: RawCAPProspectiveMemberObject
) =>
	Maybe.cata<string, ServerEither<string>>(() =>
		asyncLeft({
			type: 'OTHER',
			code: 400,
			message: 'Cannot have a link emailed if there is no email provided',
		})
	)(email => asyncRight(email, errorGenerator('Could not set password link')))(
		getMemberEmail(member.contact)
	).flatMap(email =>
		AsyncEither.All([
			getRegistry(req.mysqlx)(req.account),
			asyncRight(
				PAM.addUserAccountCreationToken(req.mysqlx, toReference(member)),
				errorGenerator('Could not create user account creation token')
			),
		]).flatMap(([registry, token]) =>
			emailFunction(true)(registry)('Finish CAPUnit.com Account Creation')(
				email
			)(`<h2>You're almost there ${getFullMemberName(member)}!</h2>
<p>To complete your CAPUnit.com account creation, click or visit the link below:</p>
<p><a href="https://${
				req.account.id
			}.capunit.com/finishaccount/${token}/">Confirm account creation</a></p>
<h4>Please respond to this email if you have any questions.</h4>`)(`You're almost there ${getFullMemberName(
				member
			)}!

To complete your CAPUnit.com account creation, copy and paste the link below into a web browser:

Please respond to this email if you have any questions`)
		)
	);

const createWithPassword = (req: Req) => (username: string) => (password: string) => (
	member: RawCAPProspectiveMemberObject
) =>
	asyncRight(
		PAM.addUserAccountCreationToken(req.mysqlx, toReference(member)),
		errorGenerator('Could not get user account creation token')
	)
		.map(token =>
			PAM.addUserAccount(
				req.mysqlx,
				req.account,
				username,
				password,
				toReference(member),
				token
			)
		)
		.map(destroy);

const createWithRandomPassword = (emailFunction: typeof sendEmail) => (req: Req) => (
	username: string
) => (member: RawCAPProspectiveMemberObject) =>
	Maybe.cata<string, ServerEither<string>>(() =>
		asyncLeft({
			type: 'OTHER',
			code: 400,
			message: 'Cannot have a link emailed if there is no email provided',
		})
	)(email => asyncRight(email, errorGenerator('Could not set password link')))(
		getMemberEmail(member.contact)
	).flatMap(email =>
		AsyncEither.All([
			getRegistry(req.mysqlx)(req.account),
			asyncRight(
				PAM.addUserAccountCreationToken(req.mysqlx, toReference(member)),
				errorGenerator('Could not create user account creation token')
			),
			asyncRight(
				promisify(randomBytes)(10),
				errorGenerator('Could not get random password')
			).map(buffer => buffer.toString('base64')),
		])
			.tap(([_, token, password]) =>
				PAM.addUserAccount(
					req.mysqlx,
					req.account,
					username,
					password,
					toReference(member),
					token
				)
			)
			.flatMap(([registry, _, password]) =>
				emailFunction(true)(registry)('Finish CAPUnit.com Account Creation')(
					email
				)(`<h4>Your account has been created!</h4>
				<p>You can now <a href="https://${req.account.id}.capunit.com/signin?returnurl=%2F">sign in</a> with the username ${username} and the password <b>${password}</b>.`)(`Your account has been created!

You can now sign in with the username ${username} and the password ${password}.`)
			)
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

export const func: (
	emailFunction?: typeof sendEmail
) => ServerAPIEndpoint<api.member.account.capprospective.CreateProspectiveAccount> = (
	emailFunction = sendEmail
) =>
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresPermission('ProspectiveMemberManagement')(request =>
			validateRequest(newProspectiveMemberAccountValidator)(request).flatMap(req =>
				asyncRight(req.account, errorGenerator('Could not create prospective member'))
					.filter(account => account.type === AccountType.CAPSQUADRON, {
						type: 'OTHER',
						code: 400,
						message:
							'CAP Prospective member accounts may only be created for a CAP Squadron account',
					})
					.map(account => account as RawCAPSquadronAccountObject)
					.map(CAP.createCAPProspectiveMember(req.mysqlx))
					.flatMap(call(req.body.member))
					.flatMap(
						req.body.login.type === CAPProspectiveMemberPasswordCreationType.EMAILLINK
							? sendPasswordLink(emailFunction)(req)
							: req.body.login.type ===
							  CAPProspectiveMemberPasswordCreationType.RANDOMPASSWORD
							? createWithRandomPassword(emailFunction)(req)(req.body.login.username)
							: createWithPassword(req)(req.body.login.username)(
									req.body.login.password
							  )
					)
			)
		)
	);

export default func();
