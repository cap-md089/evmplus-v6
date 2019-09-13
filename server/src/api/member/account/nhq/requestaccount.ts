import { MemberReference } from 'common-lib';
import {
	addUserAccountCreationToken,
	asyncErrorHandler,
	BasicValidatedRequest,
	resolveReference,
	Validator
} from '../../../../lib/internals';

interface RequestParameters {
	member: MemberReference;
	email: string;
}

export const nhqRequestValidator = new Validator<RequestParameters>({
	member: {
		validator: Validator.MemberReference
	},
	email: {
		validator: Validator.String
	}
});

export default asyncErrorHandler(async (req: BasicValidatedRequest<RequestParameters>, res) => {
	const member = await resolveReference(req.body.member, req.account, req.mysqlx, false);

	if (member === null) {
		res.status(404);
		return res.end();
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
		res.status(403);
		return res.end();
	}

	let token;
	try {
		token = await addUserAccountCreationToken(req.mysqlx, req.body.member);
	} catch (e) {
		res.status(400);
		return res.end();
	}

	// send email here
	console.log(token);

	res.status(204);
	res.end();
});
