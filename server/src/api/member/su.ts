import { Response } from 'express';
import { CAPNHQMember, isValidMemberReference, MemberRequest } from '../../lib/Members';
import { asyncErrorHandler } from '../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res: Response) => {
	if (!req.member.isRioux || !(req.member instanceof CAPNHQMember)) {
		res.status(403);
		res.end();
		return;
	}

	if (!isValidMemberReference(req.body)) {
		res.status(400);
		res.end();
		return;
	}

	await req.member.su(req.body);

	res.status(204);
	res.end();
});
