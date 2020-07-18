import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	api,
	asyncLeft,
	asyncRight,
	CAPNHQMemberReference,
	errorGenerator,
	getFullMemberName,
	getMemberEmail,
	Maybe,
	Member,
	pipe,
	UserAccountInformation,
} from 'common-lib';
import { getRegistry, PAM, resolveReference, sendEmail, ServerEither } from 'server-common';

const htmlEmailBody = (memberInfo: Member, accountInfo: UserAccountInformation) =>
	`${getFullMemberName(memberInfo)}, your login is ${accountInfo.username}.<br />
Please respond to this email if you have questions regarding your CAPUnit.com account.`;

const textEmailBody = (memberInfo: Member, accountInfo: UserAccountInformation) =>
	`${getFullMemberName(memberInfo)}, your login is ${accountInfo.username}.
Please respond to this email if you have questions regarding your CAPUnit.com account.`;

const sendEmailToMember = (emailFunction: typeof sendEmail) => (
	req: ServerAPIRequestParameter<api.member.account.capnhq.UsernameRequest>
) => (info: UserAccountInformation<CAPNHQMemberReference>) => (member: Member) => (email: string) =>
	getRegistry(req.mysqlx)(req.account)
		.map(emailFunction(true))
		.flatMap(sender =>
			sender('Username request')(email)(htmlEmailBody(member, info))(
				textEmailBody(member, info)
			)
		);

export const func: (
	emailFunction?: typeof sendEmail
) => ServerAPIEndpoint<api.member.account.capnhq.UsernameRequest> = (
	emailFunction = sendEmail
) => req =>
	asyncRight(
		PAM.verifyCaptcha(req.body.captchaToken),
		errorGenerator('Could not verify CAPTCHA token')
	)
		.filter(success => success, {
			type: 'OTHER',
			code: 400,
			message: 'Could not verify CAPTCHA token',
		})
		.map(() =>
			PAM.getInformationForMember(req.mysqlx, {
				type: 'CAPNHQMember' as const,
				id: req.body.capid,
			})
		)
		.flatMap(info =>
			resolveReference(req.mysqlx)(req.account)(info.member).flatMap(member =>
				pipe(
					Maybe.map<string, ServerEither<void>>(
						sendEmailToMember(emailFunction)(req)(info)(member)
					),
					Maybe.orSome<ServerEither<void>>(
						asyncLeft({
							type: 'OTHER',
							code: 400,
							message:
								'There is no email address associated with the account requested',
						})
					)
				)(getMemberEmail(member.contact))
			)
		);

export default func();
