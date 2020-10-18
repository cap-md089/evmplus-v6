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

import { Schema } from '@mysql/xdevapi';
import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	AccountObject,
	always,
	api,
	AsyncEither,
	asyncRight,
	CAPMemberObject,
	CAPNHQMemberObject,
	EmailSentType,
	errorGenerator,
	getFullMemberName,
	Member,
	RegistryValues,
} from 'common-lib';
import { CAP, getRegistry, PAM, resolveReference, sendEmail } from 'server-common';
import wrapper from '../../../../lib/wrapper';

const hasEmail = (email: string) => (member: CAPMemberObject) =>
	!!(
		(member.contact.CADETPARENTEMAIL.PRIMARY &&
			member.contact.CADETPARENTEMAIL.PRIMARY.toLowerCase() === email) ||
		(member.contact.CADETPARENTEMAIL.SECONDARY &&
			member.contact.CADETPARENTEMAIL.SECONDARY.toLowerCase() === email) ||
		(member.contact.CADETPARENTEMAIL.EMERGENCY &&
			member.contact.CADETPARENTEMAIL.EMERGENCY.toLowerCase() === email) ||
		(member.contact.EMAIL.PRIMARY && member.contact.EMAIL.PRIMARY.toLowerCase() === email) ||
		(member.contact.EMAIL.SECONDARY &&
			member.contact.EMAIL.SECONDARY.toLowerCase() === email) ||
		(member.contact.EMAIL.EMERGENCY && member.contact.EMAIL.EMERGENCY.toLowerCase() === email)
	);

export const getProperEmailAndSendType = (schema: Schema) => (email: string) => (id: number) => (
	member: CAPNHQMemberObject,
) =>
	CAP.getBirthday(schema)(member)
		.map<[string | undefined, EmailSentType]>(birthday =>
			+birthday > +new Date() - 13 * 365 * 24 * 3600 * 1000
				? [
						member.contact.CADETPARENTEMAIL.PRIMARY ||
							member.contact.CADETPARENTEMAIL.SECONDARY ||
							member.contact.CADETPARENTEMAIL.EMERGENCY,
						EmailSentType.TOPARENT,
				  ]
				: [email, EmailSentType.TOCADET],
		)
		.filter((emailInfo): emailInfo is [string, EmailSentType] => !!emailInfo[0], {
			type: 'OTHER',
			code: 400,
			message: 'There is no associated cadet parent email for you',
		})
		.map<[string, EmailSentType]>(i => i as [string, EmailSentType])
		.flatMap(([newEmail, emailType]) =>
			PAM.addUserAccountCreationToken(schema, {
				id,
				type: 'CAPNHQMember',
			}).map<[string, string, EmailSentType]>(token => [token, newEmail, emailType]),
		);

const emailText = (host: string) => (account: AccountObject) => (
	token: string,
) => `You're almost there!
To complete your EvMPlus.org account creation: visit the link below:
https://${account.id}.${host}/finishaccount/${token}`;

const emailHtml = (host: string) => (account: AccountObject) => (member: Member) => (
	token: string,
) => `<h2>You're almost there ${getFullMemberName(member)}!</h2>
<p>To complete your EvMPlus.org account creation, click or visit the link below:</p>
<p><a href="https://${account.id}.${host}/finishaccount/${token}">Confirm account creation</a></p>
<h4>Please respond to this email if you have questions regarding your EvMPlus.org account. If you did not request this account, simply disregard this email.</h4>`;

const writeEmail = (emailFunction = sendEmail) => (
	req: ServerAPIRequestParameter<api.member.account.capnhq.RequestNHQAccount>,
) => (member: Member) => ([[token, email, sentType], registry]: [
	[string, string, EmailSentType],
	RegistryValues,
]) =>
	emailFunction(req.configuration)(true)(registry)('EvMPlus.org Account Creation')(email)(
		emailHtml(req.configuration.HOST_NAME)(req.account)(member)(token),
	)(emailText(req.configuration.HOST_NAME)(req.account)(token)).map(always(sentType));

export const func: (
	email?: typeof sendEmail,
) => ServerAPIEndpoint<api.member.account.capnhq.RequestNHQAccount> = (
	emailFunction = sendEmail,
) => request =>
	asyncRight(request, errorGenerator('Could not create account'))
		.filter(req => PAM.verifyCaptcha(req.body.recaptcha, req.configuration), {
			type: 'OTHER',
			code: 400,
			message: 'Could not verify reCAPTCHA',
		})
		.flatMap(req =>
			resolveReference(req.mysqlx)(req.account)({
				type: 'CAPNHQMember' as const,
				id: req.body.capid,
			})
				.filter(hasEmail(req.body.email.toLowerCase()), {
					type: 'OTHER',
					code: 400,
					message: 'Email provided does not match email in database',
				})
				.flatMap(member =>
					AsyncEither.All([
						getProperEmailAndSendType(req.mysqlx)(req.body.email)(req.body.capid)(
							member,
						),
						getRegistry(req.mysqlx)(req.account),
					]).flatMap(writeEmail(emailFunction)(req)(member)),
				),
		)
		.map(wrapper);

export default func();
