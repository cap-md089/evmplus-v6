import { CAPMemberObject } from 'common-lib';
import { CAPWATCHMember, MemberRequest } from '../../../lib/Members';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArrayTyped } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	if (
		!req.member.hasDutyPosition([
			'Cadet Flight Commander',
			'Cadet Flight Sergeant',
			'Cadet Commander',
			'Cadet Deputy Commander'
		])
	) {
		res.status(403);
		return res.end();
	}

	await streamAsyncGeneratorAsJSONArrayTyped<CAPWATCHMember, CAPMemberObject>(
		res,
		req.account.getMembers(),
		mem => {
			if (
				(req.member.hasDutyPosition(['Cadet Commander', 'Cadet Deputy Commander']) &&
					!mem.seniorMember) ||
				(mem.flight === req.member.flight && mem.flight !== null)
			) {
				return mem.toRaw();
			}
			return false;
		}
	);
});
