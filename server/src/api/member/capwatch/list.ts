import { MemberRequest, NHQMember } from '../../../lib/Members';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	if (!(req.member instanceof NHQMember)) {
		res.status(400);
		return res.end();
	}

	try {
		const list = await req.member.getCAPWATCHList();

		json<string[]>(res, list);
	} catch(e) {
		res.status(403);
		res.end();
	}
});
