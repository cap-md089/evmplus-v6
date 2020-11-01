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

import * as aws from 'aws-sdk';
import {
	AsyncEither,
	asyncLeft,
	asyncRight,
	errorGenerator,
	RegistryValues,
	ServerError,
	ServerConfiguration,
} from 'common-lib';

aws.config.update({ region: 'us-east-1' });

// export async function getTestTools(testconf: typeof Configuration) {
// 	const devAccount: AccountObject = {
// 		mainCalendarID: 'r2lu9p16lh7qa5r69bv14h85i8@group.calendar.google.com',
// 		wingCalendarID: '6t22lk6thigsg6udc7rkpap2tg@group.calendar.google.com',
// 		serviceAccount: Maybe.some('md089-capunit-calendar@md089-capunit.iam.gserviceaccount.com'),
// 		shareLink: '',
// 		comments: '',
// 		id: 'mdx89',
// 		mainOrg: 916,
// 		orgIDs: [916, 2529],
// 		aliases: ['test'],
// 		discordServer: { hasValue: false },
// 		type: AccountType.CAPSQUADRON,
// 		parent: Maybe.none()
// 	};

// 	const conn = testconf.database.connection;

// 	testSession =
// 		testSession ||
// 		(await mysql.getSession({
// 			user: conn.user,
// 			password: conn.password,
// 			host: conn.host,
// 			port: conn.port
// 		}));

// 	if (testSession === undefined) {
// 		throw new Error('Could not get MySQL session!');
// 	}

// 	const schema = testSession.getSchema(testconf.database.connection.database);

// 	if (schema === undefined) {
// 		throw new Error('Could not get test schema!');
// 	}

// 	try {
// 		testAccount = testAccount || (await Account.Get('mdx89', schema));
// 	} catch (e) {
// 		testAccount = await Account.Create(devAccount, schema);
// 	}

// 	// 626814

// 	return {
// 		account: testAccount,
// 		schema,
// 		session: testSession
// 	};
// }

// export async function getTestTools2(
// 	testconf: typeof Configuration
// ): Promise<[Account, mysql.Schema, mysql.Session]> {
// 	const results = await getTestTools(testconf);

// 	return [results.account, results.schema, results.session];
// }

export type EventuallyStringFunction<T> = (param: T) => EventuallyString<T>;
export type EventuallyString<T> = string | EventuallyStringFunction<T>;

export const makeString = <T>(eventuallyString: EventuallyString<T>, param: T): string =>
	typeof eventuallyString === 'string'
		? eventuallyString
		: makeString(eventuallyString(param), param);

export const EMAIL_CHARSET = 'UTF-8';

const formatHtmlEmail = (
	config: ServerConfiguration,
	reg: RegistryValues,
	body: string,
) => `<div style="background-color:#f0f8ff;padding:20px">
<header style="background:#28497e;padding:20px;margin:0">
<a href="https://${reg.accountID}.${config.HOST_NAME}/">
<h2 style="text-align:center;color:white;">${reg.Website.Name}</h3>
<h3 style="text-align:center;color:white;">EvMPlus.org Action</h4>
</a>
</header>
<div style="border:5px solid #28497e;margin:0;padding:20px">
${body}<br /><br />
Sincerely,<br />
The EvMPlus.org Support Team
</div>
<footer style="background:#28497e;padding:25px;color:white">&copy; EvMPlus.org 2017-${new Date().getUTCFullYear()}</footer>
</div>`;

const formatTextEmail = (reg: RegistryValues, text: string) => `${reg.Website.Name}
EvMPlus.org Action

${text}

Sincerely,
The EvMPlus.org Support Team`;

export const getEmailMessageBody = (
	config: ServerConfiguration,
	registry: RegistryValues,
	subject: string,
	htmlBody: string,
	textBody: string,
): aws.SES.Message => ({
	Body: {
		Html: {
			Charset: EMAIL_CHARSET,
			Data: formatHtmlEmail(config, registry, htmlBody),
		},
		Text: {
			Charset: EMAIL_CHARSET,
			Data: formatTextEmail(registry, textBody),
		},
	},
	Subject: { Charset: EMAIL_CHARSET, Data: subject },
});

export const sendEmail = (config: ServerConfiguration) => (bccCapStMarys: boolean) => (
	registry: RegistryValues,
) => (subject: string) => (email: string | string[]) => (htmlBody: string) => (
	textBody: string,
): AsyncEither<ServerError, void> =>
	asyncRight(
		(async () => new aws.SES({ apiVersion: '2010-12-01' }))(),
		errorGenerator('Could not send email'),
	)
		.map(handle =>
			handle
				.sendEmail({
					Destination: {
						BccAddresses: bccCapStMarys ? ['capstmarys@gmail.com'] : [],
						ToAddresses: typeof email === 'string' ? [email] : email,
					},
					Message: getEmailMessageBody(config, registry, subject, htmlBody, textBody),
					Source: `"EvMPlus.org Support" <eventsupport@md.cap.gov>`,
					ReplyToAddresses: [`"EvMPlus.org Support" <eventsupport@md.cap.gov>`],
				})
				.promise(),
		)
		.flatMap(result =>
			!!result.$response.error
				? asyncLeft(errorGenerator('Could not send email')(result.$response.error))
				: asyncRight(void 0, errorGenerator('Could not send email')),
		);
