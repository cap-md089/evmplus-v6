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
	CAP,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

type Req = ServerAPIRequestParameter<api.events.events.GetEventViewerData>;
type Backend = Backends<
	[
		EventsBackend,
		AccountBackend,
		CAP.CAPMemberBackend,
		MemberBackend,
		TeamsBackend,
		RegistryBackend,
		AttendanceBackend,
	]
>;

interface LinkedEventInfo {
	id: number;
	accountID: string;
	name: string;
	accountName: string;
}

export const getViewingAccount = (account: AccountObject) => (
	event: RawResolvedEventObject,
): MaybeObj<AccountObject> =>
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

const attendanceViewerRecordMapper = (
	record: AttendanceRecord,
): api.events.events.EventViewerAttendanceRecord => ({
	member: Maybe.none(),
	record,
	orgInformation: Maybe.none(),
});

export const getAttendanceForNonAdmin = (
	backend: Backend,
	member: MaybeObj<User>,
	event: RawResolvedEventObject,
): AsyncEither<ServerError, AsyncIter<AttendanceRecord>> =>
	Maybe.isSome(member)
		? backend.getAttendanceForEvent(event).map(backend.applyAttendanceFilter(member.value))
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
					.flatMap<api.events.events.EventViewerAttendanceRecord>(member =>
						member.type === 'CAPNHQMember'
							? backend
									.getOrgInfo(member)
									.map(orgInformation => ({
										member: Maybe.some(member),
										record,
										orgInformation: Maybe.some(orgInformation),
									}))
									.leftFlatMap(
										always(
											Either.right({
												member: Maybe.some(member),
												record,
												orgInformation: Maybe.none(),
											}),
										),
									)
							: asyncRight(
									{
										member: Maybe.some(member),
										record,
										orgInformation: Maybe.none(),
									},
									errorGenerator('What?'),
							  ),
					)
					.leftFlatMap(
						always(
							Either.right({
								member: Maybe.none(),
								record,
								orgInformation: Maybe.none(),
							}),
						),
					)
					.fullJoin(),
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
						getAttendanceForNonAdmin(backend, req.member, event).map(
							asyncIterMap(attendanceViewerRecordMapper),
						),
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
							,
							attendees,
							pointsOfContact,
							sourceAccountName,
							linkedEvents,
							authorFullName,
						]) => ({
							event: filterEventInformation(req.member)(event),
							attendees,
							pointsOfContact: pointsOfContact.filter(poc => {
								console.log(
									'display',
									poc.name,
									':',
									poc.publicDisplay,
									Maybe.isSome(req.member),
								);

								return poc.publicDisplay || Maybe.isSome(req.member);
							}),
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
		[RegistryBackend, GenBackend<ReturnType<typeof getCombinedAttendanceBackend>>]
	>(getRegistryBackend, getCombinedAttendanceBackend()),
);
