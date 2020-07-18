import { MaybeObj } from '../../../lib/Maybe';
import { APIEither } from '../../../typings/api';
import {
	AttendanceRecord,
	DisplayInternalPointOfContact,
	EventObject,
	ExternalPointOfContact,
	Member,
	NewEventObject,
	RawEventObject,
} from '../../../typings/types';

export interface EventViewerAttendanceRecord {
	record: AttendanceRecord;
	member: MaybeObj<Member>;
	orgName: MaybeObj<string>;
}

export interface EventViewerData {
	event: RawEventObject;
	pointsOfContact: Array<DisplayInternalPointOfContact | ExternalPointOfContact>;
	attendees: Array<APIEither<EventViewerAttendanceRecord>>;
}

export interface Add {
	(params: {}, body: NewEventObject): APIEither<EventObject>;

	url: '/api/events/';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface Copy {
	(
		params: { id: string },
		body: {
			newTime: number;
			copyStatus: boolean | undefined | null;
			copyFiles: boolean | undefined | null;
		}
	): APIEither<EventObject>;

	url: '/api/events/:id/copy';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface GetList {
	(params: {}, body: {}): APIEither<RawEventObject[]>;

	url: '/api/events';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface Get {
	(params: { id: string }, body: {}): APIEither<EventObject>;

	url: '/api/events/:id';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface GetEventViewerData {
	(params: { id: string }, body: {}): APIEither<EventViewerData>;

	url: '/api/events/:id/viewer';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface GetNextRecurring {
	(params: {}, body: {}): APIEither<MaybeObj<RawEventObject>>;

	url: '/api/events/recurring';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface Link {
	(params: { eventID: string; targetaccount: string }, body: {}): APIEither<RawEventObject>;

	url: '/api/events/:parent/link/:targetaccount';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface GetUpcoming {
	(params: {}, body: {}): APIEither<RawEventObject[]>;

	url: '/api/events/upcoming';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface Set {
	(params: { id: string }, body: Partial<NewEventObject>): APIEither<EventObject>;

	url: '/api/events/:id';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}

export interface Delete {
	(params: { id: string }, body: {}): APIEither<void>;

	url: '/api/events/:id';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface GetRange {
	(params: { timestart: string; timeend: string }, body: {}): APIEither<RawEventObject[]>;

	url: '/api/events/:timestart/:timeend';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}
