import { APIEither } from '../../../typings/api';
import { DebriefItem, NewDebriefItem } from '../../../typings/types';

export interface Add {
	(params: { id: string }, body: NewDebriefItem): APIEither<DebriefItem[]>;

	url: '/api/events/:id/debrief';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface Delete {
	(params: { id: string; timestamp: string }, body: {}): APIEither<DebriefItem[]>;

	url: '/api/events/:id/debrief/:timestamp';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
