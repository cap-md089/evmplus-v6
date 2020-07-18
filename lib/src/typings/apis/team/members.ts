import { APIEither } from '../../../typings/api';
import { Member, NewTeamMember } from '../../../typings/types';

export interface ListTeamMembers {
	(params: { id: string }, body: {}): APIEither<Member[]>;

	url: '/api/team/:id/members';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface ModifyTeamMember {
	(params: { id: string }, body: NewTeamMember): APIEither<void>;

	url: '/api/teams/:id/members';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface AddTeamMember {
	(params: { id: string }, body: NewTeamMember): APIEither<void>;

	url: '/api/teams/:id/members';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface DeleteTeamMember {
	(params: { id: string; memberid: string }, body: {}): APIEither<void>;

	url: '/api/teams/:id/members/:memberid';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
