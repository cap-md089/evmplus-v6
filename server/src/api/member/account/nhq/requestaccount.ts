import * as aws from 'aws-sdk';
import { api, just, left, none, right } from 'common-lib';
import {
	addUserAccountCreationToken,
	asyncEitherHandler,
	BasicSimpleValidatedRequest,
	resolveReference,
	Validator,
	verifyCaptcha
} from '../../../../lib/internals';

interface RequestParameters {
	capid: number;
	email: string;
	recaptcha: string;
}

export const nhqRequestValidator = new Validator<RequestParameters>({
	capid: {
		validator: Validator.Number
	},
	email: {
		validator: Validator.String
	},
	recaptcha: {
		validator: Validator.String
	}
});

export default asyncEitherHandler<api.member.account.cap.Request>(
	async (req: BasicSimpleValidatedRequest<RequestParameters>) => {
		if (!(await verifyCaptcha(req.body.recaptcha))) {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Could not verify reCAPTCHA'
			});
		}

		let member;
		try {
			member = await resolveReference(
				{ id: req.body.capid, type: 'CAPNHQMember' },
				req.account,
				req.mysqlx,
				true
			);
		} catch (e) {
			// need to log failed attempt with req.body.capid and req.body.email here
			return left({
				code: 400,
				error: none<Error>(),
				message: 'CAPID does not exist or could not be found'
			});
		}

		const email = req.body.email.toLowerCase();

		if (
			!(
				(member.contact.CADETPARENTEMAIL.PRIMARY &&
					member.contact.CADETPARENTEMAIL.PRIMARY.toLowerCase() === email) ||
				(member.contact.CADETPARENTEMAIL.SECONDARY &&
					member.contact.CADETPARENTEMAIL.SECONDARY.toLowerCase() === email) ||
				(member.contact.CADETPARENTEMAIL.EMERGENCY &&
					member.contact.CADETPARENTEMAIL.EMERGENCY.toLowerCase() === email) ||
				(member.contact.EMAIL.PRIMARY &&
					member.contact.EMAIL.PRIMARY.toLowerCase() === email) ||
				(member.contact.EMAIL.SECONDARY &&
					member.contact.EMAIL.SECONDARY.toLowerCase() === email) ||
				(member.contact.EMAIL.EMERGENCY &&
					member.contact.EMAIL.EMERGENCY.toLowerCase() === email)
			)
		) {
			// need to log failed attempt with req.body.capid and req.body.email here
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Email provided does not match email in database'
			});
		}

		let token;
		try {
			token = await addUserAccountCreationToken(req.mysqlx, {
				id: req.body.capid,
				type: 'CAPNHQMember'
			});
		} catch (e) {
			// need to log failed attempt with req.body.capid and req.body.email here
			return left({
				code: 400,
				error: none<Error>(),
				message: e.message
			});
		}

		// send email here
		aws.config.update({ region: 'us-east-1' });
		const thisAccount = req.account.id;

		const subjectmessage = 'CAPUnit.com Account Creation';
		let htmlmessage = '<h2>You\'re almost there ' + member.memberRank + " " + member.nameFirst + " " + member.nameLast + '!</h2>';
		htmlmessage += '<p>To complete your CAPUnit.com account creation, click or visit the link below:</p>';
		htmlmessage += '<p><a href="https://'+ thisAccount +'.capunit.com/finishaccount/' + token + '">Confirm account creation';
		htmlmessage += '</a><p><h4>Please respond to this email if you have questions regarding your ';
		htmlmessage += 'CAPUnit.com account.  If you did not request this account, simply disregard this email.</h4></p>';
		htmlmessage += '<p hidden>Diagnostic information used if \"Reply\" selected: CAPID = ' + req.body.capid + ', email address = ' + email;
		htmlmessage += ',ip address = ' + req.ip + ', original URL' + req.originalUrl + '</p>';
		htmlmessage += 'Sincerely,<br>The CAPUnit.com Support Team';
		let textmessage = 'You\'re almost there!\n';
		textmessage += 'To complete your CAPUnit.com account creation, click or visit the link below:\n';
		textmessage += `https://`+ thisAccount +`.capunit.com/finishaccount/`+ token +`\n\n`;
		textmessage += 'Sincerely,\n';
		textmessage += 'The CAPUnit.com Support Team';
		const charsetinuse = 'UTF-8';

		const emailParams = {
			Destination: {
				BccAddresses: ['capstmarys@gmail.com'],
			// 	CcAddresses: [''],
				ToAddresses: [ email ]
			},
			Message: {
				Body: {
					Html: { Charset: charsetinuse, Data: htmlmessage },
					Text: { Charset: charsetinuse, Data: textmessage }
				},
				Subject: { Charset: charsetinuse, Data: subjectmessage }
			},
			Source: '"CAPUnit.com Support" <support@capunit.com>',
			ReplyToAddresses: ['"CAPUnit.com Support" <support@capunit.com>']
		};
		const SEShandle = new aws.SES({ apiVersion: '2010-12-01' });

		// https://{account.id}.capunit.com/finishaccount/{token}
		try {
			const sendPromise = await SEShandle.sendEmail(emailParams).promise();
			if (!!sendPromise.$response.error) {
				throw sendPromise.$response.error;
			}
		} catch (e) {
			// need to log failed attempt with req.body.capid and req.body.email here
			return left({
				code: 500,
				error: just(e),
				message: 'Email failed to send'
			});
		}
		// need to log successful attempt with req.body.capid and req.body.email here
		console.log(token);

		return right(void 0);
	}
);
