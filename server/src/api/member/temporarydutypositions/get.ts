import { left, MemberReference, none, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, resolveReference } from '../../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberRequest<{ id: string; type: string }>) => {
	let ref: MemberReference;
	if (req.params.type === 'CAPNHQMember') {
		if (parseInt(req.params.id, 10) !== parseInt(req.params.id, 10)) {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Invalid CAP ID'
			});
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
		return left({
			code: 400,
			error: none<Error>(),
			message: 'Invalid member type'
		});
	}

	let member;
	try {
		member = await resolveReference(ref, req.account, req.mysqlx, true);
	} catch (e) {
		return left({
			code: 404,
			error: none<Error>(),
			message: 'Could not find member specified'
		});
	}

	return right(member.dutyPositions.filter(d => d.type === 'CAPUnit'));
});
