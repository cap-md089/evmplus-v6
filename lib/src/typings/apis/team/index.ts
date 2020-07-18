import { APIEither } from '../../../typings/api';
import { FullTeamObject, NewTeamObject } from '../../../typings/types';

export * as members from './members';

export interface CreateTeam {
	(params: {}, body: NewTeamObject): APIEither<FullTeamObject>;

	url: '/api/team';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface GetTeam {
	(params: { id: string }, body: {}): APIEither<FullTeamObject>;

	url: '/api/team/:id';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface ListTeams {
	(params: {}, body: {}): APIEither<FullTeamObject[]>;

	url: '/api/team';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface DeleteTeam {
	(params: { id: string }, body: {}): APIEither<void>;

	url: '/api/team/:id';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface SetTeamData {
	(params: { id: string }, body: Partial<NewTeamObject>): APIEither<void>;

	url: '/api/team/:id';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}
