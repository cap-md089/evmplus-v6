/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
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

import { Schema } from '@mysql/xdevapi';
import { AsyncRepr, ServerAPIRequestParameter, ServerEither } from 'auto-client-api';
import {
	AccountObject,
	always,
	api,
	AsyncEither,
	AsyncIter,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	AttendanceRecord,
	canMaybeFullyManageEvent,
	DisplayInternalPointOfContact,
	Either,
	EitherObj,
	errorGenerator,
	EventType,
	ExternalPointOfContact,
	filterEventInformation,
	get,
	getAppropriateDebriefItems,
	Maybe,
	RawLinkedEvent,
	RawResolvedEventObject,
	RegistryValues,
	Right,
	ServerError,
} from 'common-lib';
import {
	AccountBackend,
	Backends,
	EventsBackend,
	getAccountBackend,
	getAttendanceForEvent,
	getEventsBackend,
	getFullPointsOfContact,
	getLinkedEvents,
	getMemberBackend,
	getMemberName,
	getMemoizedAccountGetter,
	getOrgName,
	getRegistry,
	getRegistryById,
	getTeamsBackend,
	MemberBackend,
	resolveReference,
	TeamsBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

type Req = ServerAPIRequestParameter<api.events.events.GetEventViewerData>;

interface LinkedEventInfo {
	id: number;
	accountID: string;
	name: string;
	accountName: string;
}

export const getViewingAccount = (account: AccountObject) => (event: RawResolvedEventObject) =>
	event.type === EventType.LINKED ? Maybe.some(account) : Maybe.none();

export const expandLinkedEvent = (schema: Schema) => (name: string) => ({
	id,
	accountID,
}: RawLinkedEvent): ServerEither<LinkedEventInfo> =>
	getRegistryById(schema)(accountID).map(({ Website: { Name: accountName } }) => ({
		accountName,
		name,
		id,
		accountID,
	}));

export const getSourceAccountName = (
	event: RawResolvedEventObject,
	req: Req,
): AsyncEither<ServerError, string | undefined> =>
	event.type === EventType.LINKED
		? getRegistryById(req.mysqlx)(event.targetAccountID).map(reg => reg.Website.Name)
		: asyncRight(void 0, errorGenerator('Could not get account name'));

export const getEventPOCs = (
	req: Req,
	event: RawResolvedEventObject,
): AsyncEither<ServerError, Array<DisplayInternalPointOfContact | ExternalPointOfContact>> =>
	getFullPointsOfContact(req.mysqlx)(req.account)(
		event.pointsOfContact.map(poc => ({
			...poc,
			email: !!poc.publicDisplay || Maybe.isSome(req.member) ? poc.email : '',
			phone: !!poc.publicDisplay || Maybe.isSome(req.member) ? poc.phone : '',
		})),
	);

const checkAttendeesForRequest = (
	event: RawResolvedEventObject,
	req: Req,
	registry: RegistryValues,
	attendees: AsyncIter<AttendanceRecord>,
): AsyncRepr<Array<EitherObj<ServerError, api.events.events.EventViewerAttendanceRecord>>> =>
	event.privateAttendance && !canMaybeFullyManageEvent(req.member)(event)
		? []
		: asyncIterMap((record: AttendanceRecord) =>
				Either.right({
					member: Maybe.none(),
					record,
					orgName: Maybe.some(registry.Website.Name),
				}),
		  )(attendees);

export const getAttendanceForNonAdmin = (
	req: Req,
	event: RawResolvedEventObject,
): AsyncEither<ServerError, AsyncIter<AttendanceRecord>> =>
	Maybe.isSome(req.member)
		? getAttendanceForEvent(req.mysqlx)(event)
		: asyncRight<ServerError, AsyncIter<AttendanceRecord>>([], errorGenerator());

export const getLinkedEventsForViewer = (
	req: Req,
	event: RawResolvedEventObject,
): AsyncEither<ServerError, AsyncIter<LinkedEventInfo>> =>
	asyncRight(
		asyncIterMap(expandLinkedEvent(req.mysqlx)(event.name))(
			getLinkedEvents(req.mysqlx)(event.accountID)(event.id),
		),
		errorGenerator('Could not get linked events'),
	)
		.map(
			asyncIterFilter<EitherObj<ServerError, LinkedEventInfo>, Right<LinkedEventInfo>>(
				Either.isRight,
			),
		)
		.map(asyncIterMap(get('value')));

export const getFullEventInformation = (req: Req) => (
	event: RawResolvedEventObject,
): ServerEither<AsyncRepr<api.events.events.EventViewerData>> =>
	AsyncEither.All([
		asyncRight(
			getOrgName(getMemoizedAccountGetter(req.mysqlx))(req.mysqlx)(req.account),
			errorGenerator('Could not get member record information'),
		).flatMap(orgNameGetter =>
			getAttendanceForEvent(req.mysqlx)(event).map(
				asyncIterMap(record =>
					resolveReference(req.mysqlx)(req.account)(record.memberID)
						.flatMap(member =>
							orgNameGetter(member).map(orgName => ({
								member: Maybe.some(member),
								record,
								orgName,
							})),
						)
						.leftFlatMap(
							always(
								Either.right({
									member: Maybe.none(),
									record,
									orgName: Maybe.none(),
								}),
							),
						),
				),
			),
		),
		getFullPointsOfContact(req.mysqlx)(req.account)(event.pointsOfContact),
		getSourceAccountName(event, req),
		getLinkedEventsForViewer(req, event),
		getMemberName(req.mysqlx)(req.account)(event.author).map(Maybe.some),
	]).map<AsyncRepr<api.events.events.EventViewerData>>(
		([attendees, pointsOfContact, sourceAccountName, linkedEvents, authorFullName]) => ({
			event,
			attendees,
			pointsOfContact,
			sourceAccountName,
			linkedEvents,
			authorFullName,
		}),
	);

export const func: Endpoint<
	Backends<[EventsBackend, AccountBackend, MemberBackend, TeamsBackend]>,
	api.events.events.GetEventViewerData
> = backend => req =>
	backend
		.getEvent(req.account)(req.params.id)
		.flatMap(backend.ensureResolvedEvent)
		.map(getAppropriateDebriefItems(req.member))
		.flatMap(event =>
			canMaybeFullyManageEvent(req.member)(event)
				? getFullEventInformation(req)(event)
				: AsyncEither.All([
						getRegistry(req.mysqlx)(req.account),
						getAttendanceForNonAdmin(req, event),
						getEventPOCs(req, event),
						getSourceAccountName(event, req),
						getLinkedEventsForViewer(req, event),
						Maybe.isSome(req.member)
							? getMemberName(req.mysqlx)(req.account)(event.author).map(Maybe.some)
							: asyncRight(
									Maybe.none(),
									errorGenerator('Could not get event author name'),
							  ),
				  ]).map<AsyncRepr<api.events.events.EventViewerData>>(
						([
							registry,
							attendees,
							pointsOfContact,
							sourceAccountName,
							linkedEvents,
							authorFullName,
						]) => ({
							event: filterEventInformation(req.member)(event),
							attendees: checkAttendeesForRequest(event, req, registry, attendees),
							pointsOfContact,
							sourceAccountName,
							linkedEvents,
							authorFullName,
						}),
				  ),
		)
		.map(wrapper);

export default withBackends(
	func,
	getEventsBackend,
	getAccountBackend,
	getMemberBackend,
	getTeamsBackend,
);
