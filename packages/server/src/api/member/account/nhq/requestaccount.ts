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
import { Endpoint } from '../../../..';
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

export const getProperEmailAndSendType = (backends: Backends<[MemberBackend, PAM.PAMBackend]>) => (
	email: string,
) => (id: number) => (member: CAPNHQMemberObject) =>
	backends
		.getBirthday(member)
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
			backends
				.addUserAccountCreationToken({
					id,
					type: 'CAPNHQMember',
				})
				.map<[string, string, EmailSentType]>(token => [token, newEmail, emailType]),
		);

const getEmail = (member: Member) => (email: string) => (token: string): EmailSetup => ({
	url,
}) => ({
	bccAddresses: [SUPPORT_BCC_ADDRESS],
	to: [email],
	subject: 'Event Manager Account Creation',
	textBody: `You're almost there!
To complete your Event Manager account creation: visit the link below:
${url}/finishaccount/${token}`,
	htmlBody: `<h2>You're almost there ${getFullMemberName(member)}!</h2>
<p>To complete your Eveent Manager account creation, click or visit the link below:</p>
<p><a href="${url}/finishaccount/${token}">Confirm account creation</a></p>
<h4>Please respond to this email if you have questions regarding your Event Manager account. If you did not request this account, simply disregard this email.</h4>`,
});

const writeEmail = (backend: EmailBackend) => (member: Member) => ([
	[token, email, sentType],
	registry,
]: [[string, string, EmailSentType], RegistryValues]) =>
	backend.sendEmail(registry)(getEmail(member)(email)(token)).map(always(sentType));

export const func: Endpoint<
	Backends<[RegistryBackend, EmailBackend, PAM.PAMBackend, MemberBackend]>,
	api.member.account.capnhq.RequestNHQAccount
> = backend => request =>
	asyncRight(request, errorGenerator('Could not create account'))
		.filter(req => backend.verifyCaptcha(req.body.recaptcha), {
			type: 'OTHER',
			code: 400,
			message: 'Could not verify reCAPTCHA',
		})
		.flatMap(req =>
			backend
				.getMember(req.account)({ type: 'CAPNHQMember', id: req.body.capid })
				.filter(hasEmail(req.body.email.toLowerCase()), {
					type: 'OTHER',
					code: 400,
					message: 'Email provided does not match email in database',
				})
				.flatMap(member =>
					AsyncEither.All([
						getProperEmailAndSendType(backend)(req.body.email)(req.body.capid)(member),
						backend.getRegistry(req.account),
					]).flatMap(writeEmail(backend)(member)),
				),
		)
		.map(wrapper);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[RegistryBackend, EmailBackend, MemberBackend, PAM.PAMBackend]
	>(getRegistryBackend, getEmailBackend, getCombinedMemberBackend(), PAM.getPAMBackend),
);
