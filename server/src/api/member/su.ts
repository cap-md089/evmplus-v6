import {
	api,
	just,
	left,
	MemberReference,
	NHQMemberReference,
	none,
	ProspectiveMemberReference,
	right
} from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberRequest,
	CAPNHQMember,
	isValidMemberReference
} from '../../lib/internals';

export default asyncEitherHandler<api.member.Su>(async (req: BasicMemberRequest) => {
	if (!req.member.isRioux || !(req.member instanceof CAPNHQMember)) {
		return left({
			code: 403,
			error: none<Error>(),
			message: 'Member has invalid permissions to perform this action'
		});
	}

	if (!isValidMemberReference(req.body)) {
		return left({
			code: 400,
			error: none<Error>(),
			message: 'You provided an invalid member, dummy'
		});
	}

	try {
		await req.member.su(
			req.body.type === 'Null'
				? {
						type: 'Null'
				  }
				: ({
						type: req.body.type,
						id: (req.body as NHQMemberReference | ProspectiveMemberReference).id
				  } as MemberReference)
		);
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Could not su as target member'
		});
	}

	return right(void 0);
});
