import { MemberRequest, NHQMember } from '../../../lib/Members';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	if (!(req.member instanceof NHQMember)) {
		res.status(400);
		return res.end();
	}

	const list = await req.member.getCAPWATCHList();

	json<string[]>(res, list);
});
