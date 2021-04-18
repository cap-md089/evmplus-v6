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
	MaybeObj,
	RawLinkedEvent,
	RawResolvedEventObject,
	RegistryValues,
	Right,
	ServerError,
	User,
} from 'common-lib';
import {
	AccountBackend,
	AttendanceBackend,
	Backends,
	BasicAccountRequest,
	combineBackends,
	EventsBackend,
	GenBackend,
	getCombinedAttendanceBackend,
	getRegistryBackend,
	MemberBackend,
	RegistryBackend,
	TeamsBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

type Req = ServerAPIRequestParameter<api.events.events.GetEventViewerData>;
type Backend = Backends<
	[EventsBackend, AccountBackend, MemberBackend, TeamsBackend, RegistryBackend, AttendanceBackend]
>;

interface LinkedEventInfo {
	id: number;
	accountID: string;
	name: string;
	accountName: string;
}

export const getViewingAccount = (account: AccountObject) => (event: RawResolvedEventObject) =>
	event.type === EventType.LINKED ? Maybe.some(account) : Maybe.none();

export const expandLinkedEvent = (backend: Backends<[RegistryBackend]>) => (name: string) => ({
	id,
	accountID,
}: RawLinkedEvent): ServerEither<LinkedEventInfo> =>
	backend.getRegistryUnsafe(accountID).map(({ Website: { Name: accountName } }) => ({
		accountName,
		name,
		id,
		accountID,
	}));

export const getSourceAccountName = (
	event: RawResolvedEventObject,
	backend: Backend,
): AsyncEither<ServerError, string | undefined> =>
	event.type === EventType.LINKED
		? backend.getRegistryUnsafe(event.targetAccountID).map(reg => reg.Website.Name)
		: asyncRight(void 0, errorGenerator('Could not get account name'));

export const getEventPOCs = (
	backend: Backend,
	event: RawResolvedEventObject,
	viewer: MaybeObj<User>,
): AsyncEither<ServerError, Array<DisplayInternalPointOfContact | ExternalPointOfContact>> =>
	backend.getAccount(event.accountID).flatMap(account =>
		backend.getFullPointsOfContact(account)(
			event.pointsOfContact.map(poc => ({
				...poc,
				email: !!poc.publicDisplay || Maybe.isSome(viewer) ? poc.email : '',
				phone: !!poc.publicDisplay || Maybe.isSome(viewer) ? poc.phone : '',
			})),
		),
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
	backend: Backend,
	member: MaybeObj<User>,
	event: RawResolvedEventObject,
): AsyncEither<ServerError, AsyncIter<AttendanceRecord>> =>
	Maybe.isSome(member)
		? backend.getAttendanceForEvent(event)
		: asyncRight<ServerError, AsyncIter<AttendanceRecord>>([], errorGenerator());

export const getLinkedEventsForViewer = (
	req: Req,
	backend: Backend,
	event: RawResolvedEventObject,
): AsyncEither<ServerError, AsyncIter<LinkedEventInfo>> =>
	backend
		.getAccount(event.accountID)
		.map(account =>
			asyncIterMap(expandLinkedEvent(backend)(event.name))(
				backend.getLinkedEvents(account)(event.id),
			),
		)
		.map(
			asyncIterFilter<EitherObj<ServerError, LinkedEventInfo>, Right<LinkedEventInfo>>(
				Either.isRight,
			),
		)
		.map(asyncIterMap(get('value')));

export const getFullEventInformation = (
	req: Req,
	event: RawResolvedEventObject,
	backend: Backend,
): ServerEither<AsyncRepr<api.events.events.EventViewerData>> =>
	AsyncEither.All([
		backend.getAttendanceForEvent(event).map(
			asyncIterMap(record =>
				backend
					.getMember(req.account)(record.memberID)
					.flatMap(member =>
						backend
							.getOrgNameForMember(req.account)(member)
							.map(orgName => ({
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
		backend.getFullPointsOfContact(req.account)(event.pointsOfContact),
		getSourceAccountName(event, backend),
		getLinkedEventsForViewer(req, backend, event),
		backend.getMemberName(req.account)(event.author).map(Maybe.some),
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

export const func: Endpoint<Backend, api.events.events.GetEventViewerData> = backend => req =>
	backend
		.getEvent(req.account)(req.params.id)
		.flatMap(backend.ensureResolvedEvent)
		.map(getAppropriateDebriefItems(req.member))
		.flatMap(event =>
			canMaybeFullyManageEvent(req.member)(event)
				? getFullEventInformation(req, event, backend)
				: AsyncEither.All([
						backend.getRegistry(req.account),
						getAttendanceForNonAdmin(backend, req.member, event),
						getEventPOCs(backend, event, req.member),
						getSourceAccountName(event, backend),
						getLinkedEventsForViewer(req, backend, event),
						Maybe.isSome(req.member)
							? backend.getMemberName(req.account)(event.author).map(Maybe.some)
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
	combineBackends<
		BasicAccountRequest,
		[RegistryBackend, GenBackend<typeof getCombinedAttendanceBackend>]
	>(getRegistryBackend, getCombinedAttendanceBackend),
);
