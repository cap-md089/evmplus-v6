import { Response } from 'express';
import { MemberRequest, NHQMember } from '../../lib/Members';
import { asyncErrorHandler } from '../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res: Response) => {
	if (!req.member.isRioux || !(req.member instanceof NHQMember)) {
		res.status(403);
		res.end();
		return;
	}

	if (req.body === undefined || req.body.id === undefined) {
		res.status(400);
		res.end();
		return;
	}

	const sessionID = await req.member.su(req.body.id)

	res.json({
		sessionID
	});
});
