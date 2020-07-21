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

import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	AccountObject,
	api,
	AsyncEither,
	asyncLeft,
	asyncRight,
	errorGenerator,
	getFullMemberName,
	getMemberEmail,
	Maybe,
	RegistryValues,
	ServerError,
	UserAccountInformation,
} from 'common-lib';
import { getRegistry, PAM, resolveReference, sendEmail } from 'server-common';

const formatUrl = (account: AccountObject) => (token: string) =>
	`https://${account.id}.capunit.com/finishpasswordreset/${token}`;

const emailHtml = (memberName: string) => (resetUrl: string) =>
	`We have detected that a password reset was requested for you, ${memberName}. ` +
	`If you did not request this action, you can safely ignore this email. ` +
	`<a href="${resetUrl}">Go here</a> to reset your password. ` +
	`This link will expire within 24 hours.`;

const emailText = (memberName: string) => (resetUrl: string) =>
	`We have detected that a password reset was requested for you, ${memberName}. ` +
	`If you did not request this action, you can safely ignore this email. ` +
	`This link will expire within 24 hours.\n\nLink: ${resetUrl}`;

const getMemberAndSendEmail = (emailFunction: typeof sendEmail) => (
	req: ServerAPIRequestParameter<api.member.account.PasswordResetRequest>
) => (account: UserAccountInformation) => (registry: RegistryValues) => (resetUrl: string) =>
	resolveReference(req.mysqlx)(req.account)(account.member).flatMap(member =>
		Maybe.cata<string, AsyncEither<ServerError, void>>(() =>
			asyncLeft<ServerError, void>({
				type: 'OTHER',
				code: 400,
				message: 'Member does not have an email',
			})
		)(email =>
			emailFunction(true)(registry)(`Password reset for ${getFullMemberName(member)}`)(email)(
				emailHtml(getFullMemberName(member))(resetUrl)
			)(emailText(getFullMemberName(member))(resetUrl))
		)(getMemberEmail(member.contact))
	);

export const func: (
	emailFunction?: typeof sendEmail
) => ServerAPIEndpoint<api.member.account.PasswordResetRequest> = (
	emailFunction = sendEmail
) => req =>
	asyncRight(req, errorGenerator('Could not request username'))
		.filter(() => PAM.verifyCaptcha(req.body.captchaToken, req.configuration), {
			type: 'OTHER',
			code: 400,
			message: 'Could not verify reCAPTCHA',
		})
		.flatMap(() =>
			AsyncEither.All([
				asyncRight(
					PAM.getInformationForUser(req.mysqlx, req.body.username),
					errorGenerator('Could not load website configuration')
				),
				getRegistry(req.mysqlx)(req.account),
			])
		)
		.flatMap(([account, registry]) =>
			PAM.createPasswordResetToken(req.mysqlx, account.username)
				.map(formatUrl(req.account))
				.flatMap(getMemberAndSendEmail(emailFunction)(req)(account)(registry))
		);

export default func();
