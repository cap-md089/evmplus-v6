/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * This file documents how to use APIs that manage event resources
 *
 * See `common-lib/src/typings/api.ts` for more information
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { MaybeObj } from '../../../lib/Maybe';
import { APIEither } from '../../api';
import {
	AttendanceRecord,
	DisplayInternalPointOfContact,
	EventObject,
	EventStatus,
	ExternalPointOfContact,
	Member,
	NewEventObject,
	RawEventObject,
} from '../../types';

/**
 * Contains information needed to display an attendance record in EventViewer.tsx
 */
export interface EventViewerAttendanceRecord {
	record: AttendanceRecord;
	member: MaybeObj<Member>;
	orgName: MaybeObj<string>;
}

/**
 * Contains information needed to display an event in EVentViewer.tsx
 */
export interface EventViewerData {
	event: RawEventObject;
	pointsOfContact: Array<DisplayInternalPointOfContact | ExternalPointOfContact>;
	attendees: Array<APIEither<EventViewerAttendanceRecord>>;
	sourceAccountName?: string | undefined;
	linkedEvents: Array<{
		id: number;
		accountID: string;
		name: string;
		accountName: string;
	}>;
	authorFullName: MaybeObj<string>;
}

/**
 * Given the event information, adds it to the squadron calendar and the associated
 * Google calendar
 */
export interface Add {
	(params: {}, body: NewEventObject): APIEither<EventObject>;

	url: '/api/events/';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Copies an event, changing all the times to maintain the same delta, but
 * based off of the new time
 */
export interface Copy {
	(
		params: { id: string },
		body: {
			newTime: number;
			newStatus: EventStatus | undefined | null;
			copyFiles: boolean | undefined | null;
		},
	): APIEither<EventObject>;

	url: '/api/events/:id/copy';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Gets a list of events
 *
 * For optimal results, specify a page and page size
 * TODO: Allow this to be done
 */
export interface GetList {
	(params: {}, body: {}): APIEither<RawEventObject[]>;

	url: '/api/events';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Gets full event information for the requested event
 */
export interface Get {
	(params: { id: string }, body: {}): APIEither<EventObject>;

	url: '/api/events/:id';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Downloads event viewer data for an event
 *
 * Contains event information and a lot of other relevant information,
 * including:
 * 	- The name of the account this event is linked from, if applicable
 * 	- Attendance for the event
 *  - Point of contact information
 */
export interface GetEventViewerData {
	(params: { id: string }, body: {}): APIEither<EventViewerData>;

	url: '/api/events/:id/viewer';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Get's the next meeting with the 'Recurring Meeting' activity type set
 */
export interface GetNextRecurring {
	(params: {}, body: {}): APIEither<MaybeObj<RawEventObject>>;

	url: '/api/events/recurring';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

/**
 * Creates a link between the specified account and event
 */
export interface Link {
	(params: { eventid: string; targetaccount: string }, body: {}): APIEither<RawEventObject>;

	url: '/api/events/:eventid/link/:targetaccount';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Gets the next `X` events, where `X` is defined in the Registry as `Website.ShowUpcomingEventCount`
 */
export interface GetUpcoming {
	(params: {}, body: {}): APIEither<RawEventObject[]>;

	url: '/api/events/upcoming';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

/**
 * Updates event information for the specified event
 */
export interface Set {
	(params: { id: string }, body: Partial<NewEventObject>): APIEither<EventObject>;

	url: '/api/events/:id';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}

/**
 * Deletes the event specified
 */
export interface Delete {
	(params: { id: string }, body: {}): APIEither<void>;

	url: '/api/events/:id';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Gets all events between the two specified timestamps
 *
 * timestart and timeend are Unix timestamps in milliseconds, the same as the return value
 * from Date.now()
 */
export interface GetRange {
	(params: { timestart: string; timeend: string }, body: {}): APIEither<RawEventObject[]>;

	url: '/api/events/:timestart/:timeend';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}
