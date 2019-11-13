import {
	addUserAccountCreationToken,
	asyncErrorHandler,
	BasicValidatedRequest,
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

export default asyncErrorHandler(async (req: BasicValidatedRequest<RequestParameters>, res) => {
	if (!(await verifyCaptcha(req.body.recaptcha))) {
		res.status(400);
		return res.json({
			error: 'Could not verify reCAPTCHA'
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
		res.status(400);
		return res.json({
			error: 'CAPID does not exist or could not be found'
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
		res.status(400);
		return res.json({
			error: 'Email provided does not match email in database'
		});
	}

	let token;
	try {
		token = await addUserAccountCreationToken(req.mysqlx, {
			id: req.body.capid,
			type: 'CAPNHQMember'
		});
	} catch (e) {
		res.status(400);
		return res.json({
			error: e.message
		});
	}

	// send email here
	console.log(token);

	res.status(200);
	res.json({
		error: 'none'
	});
});
