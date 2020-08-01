/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { MaybeObj } from '../../../lib/Maybe';
import { APIEither } from '../../api';
import {
	AttendanceRecord,
	DisplayInternalPointOfContact,
	EventObject,
	ExternalPointOfContact,
	Member,
	NewEventObject,
	RawEventObject
} from '../../types';

export interface EventViewerAttendanceRecord {
	record: AttendanceRecord;
	member: MaybeObj<Member>;
	orgName: MaybeObj<string>;
}

export interface EventViewerData {
	event: RawEventObject;
	pointsOfContact: Array<DisplayInternalPointOfContact | ExternalPointOfContact>;
	attendees: Array<APIEither<EventViewerAttendanceRecord>>;
	sourceAccountName?: string | undefined;
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
	(params: { eventid: string; targetaccount: string }, body: {}): APIEither<RawEventObject>;

	url: '/api/events/:eventid/link/:targetaccount';

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
