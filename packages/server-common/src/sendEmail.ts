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
import * as aws from 'aws-sdk';
import {
	AsyncEither,
	asyncLeft,
	asyncRight,
	errorGenerator,
	RegistryValues,
	ServerError,
	ServerConfiguration,
	BasicMySQLRequest,
} from 'common-lib';
import { notImplementedError } from './backends';

export const SUPPORT_BCC_ADDRESS = 'capstmarys@gmail.com';

aws.config.update({ region: 'us-east-1' });

const EMAIL_CHARSET = 'UTF-8';

const formatHtmlEmail = (
	config: ServerConfiguration,
	reg: RegistryValues,
	body: string,
): string => `<div style="background-color:#f0f8ff;padding:20px">
<header style="background:#28497e;padding:20px;margin:0">
<a href="https://${reg.accountID}.${config.HOST_NAME}/">
<h2 style="text-align:center;color:white;">${reg.Website.Name}</h3>
<h3 style="text-align:center;color:white;">Maryland Wing CAP Event Manager Action</h4>
</a>
</header>
<div style="border:5px solid #28497e;margin:0;padding:20px">
${body}<br /><br />
Sincerely,<br />
The Event Manager Support Team
</div>
<footer style="background:#28497e;padding:25px;color:white">&copy; Event Manager 2017-${new Date().getUTCFullYear()}</footer>
</div>`;

const formatTextEmail = (reg: RegistryValues, text: string): string => `${reg.Website.Name}
Maryland Wing CAP Event Manager Action

${text}

Sincerely,
The Event Manager Support Team`;

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

export const sendEmail = (config: ServerConfiguration) => (bccAddresses: string[]) => (
	registry: RegistryValues,
) => (subject: string) => (email: string | string[]) => (htmlBody: string) => (
	textBody: string,
): AsyncEither<ServerError, void> =>
	asyncRight(
		(() =>
			new aws.SES({
				apiVersion: '2010-12-01',
				accessKeyId: config.AWS_ACCESS_KEY_ID,
				secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
			}))(),
		errorGenerator('Could not send email'),
	)
		.map(handle =>
			handle
				.sendEmail({
					Destination: {
						BccAddresses: bccAddresses,
						ToAddresses: typeof email === 'string' ? [email] : email,
					},
					Message: getEmailMessageBody(config, registry, subject, htmlBody, textBody),
					Source: `"Event Manager Support" <support@evmplus.org>`,
					ReplyToAddresses: [`"Event Manager Support" <eventsupport@md.cap.gov>`],
				})
				.promise(),
		)
		.flatMap(result =>
			!!result.$response.error
				? asyncLeft(errorGenerator('Could not send email')(result.$response.error))
				: asyncRight(void 0, errorGenerator('Could not send email')),
		);

export interface EmailToSend {
	to: string[];
	bccAddresses: string[];
	subject: string;
	htmlBody: string;
	textBody: string;
}

export interface EmailParameters {
	url: string;
}

export type EmailSetup = (parameters: EmailParameters) => EmailToSend;

export interface EmailBackend {
	sendEmail: (
		registry: RegistryValues,
	) => (emailGenerator: (url: EmailParameters) => EmailToSend) => ServerEither<void>;
}

export const getEmailBackend = (req: BasicMySQLRequest): EmailBackend => ({
	sendEmail: registry => emailGenerator => {
		const email = emailGenerator({
			url: `https://${registry.accountID}.${req.configuration.HOST_NAME}`,
		});

		return sendEmail(req.configuration)(email.bccAddresses)(registry)(email.subject)(email.to)(
			email.htmlBody,
		)(email.textBody);
	},
});

export const getEmptyEmailBackend = (): EmailBackend => ({
	sendEmail: () => () => notImplementedError('sendEmail'),
});
