import { MemberReference, ShortDutyPosition } from 'common-lib';
import { asyncErrorHandler, json, MemberRequest, resolveReference } from '../../../lib/internals';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string; type: string }>, res) => {
	let ref: MemberReference;
	if (req.params.type === 'CAPNHQMember') {
		if (parseInt(req.params.id, 10) !== parseInt(req.params.id, 10)) {
			res.status(400);
			return res.end();
		}

		ref = {
			type: 'CAPNHQMember',
			id: parseInt(req.params.id, 10)
		};
	} else if (req.params.type === 'CAPProspectiveMember') {
		ref = {
			type: 'CAPProspectiveMember',
			id: req.params.id
		};
	} else {
		res.status(400);
		return res.end();
	}

	const member = await resolveReference(ref, req.account, req.mysqlx, false);

	if (!member) {
		res.status(404);
		return res.end();
	}

	json<ShortDutyPosition[]>(
		res,
		member.dutyPositions.filter(d => d.type === 'CAPUnit')
	);
});
