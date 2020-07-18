import { APIEither } from '../../../api';
import { CAPProspectiveMemberPasswordCreation, NewCAPProspectiveMember } from '../../../types';

export interface CreateProspectiveAccount {
	(
		params: {},
		body: {
			member: NewCAPProspectiveMember;
			login: CAPProspectiveMemberPasswordCreation;
		}
	): APIEither<void>;

	url: '/api/member/account/capnhq/requestaccount';

	method: 'post';

	requiresMember: 'required';

	needsToken: false;

	useValidator: false;
}
