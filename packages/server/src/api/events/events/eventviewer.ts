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
import {
	AsyncRepr,
	ServerAPIEndpoint,
	ServerAPIRequestParameter,
	ServerEither,
} from 'auto-client-api';
import {
	always,
	api,
	AsyncEither,
	AsyncIter,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	AttendanceRecord,
	canMaybeManageEvent,
	collectGeneratorAsync,
	Either,
	EitherObj,
	errorGenerator,
	get,
	Maybe,
	memoize,
	Permissions,
	RawEventObject,
	Right,
	ServerError,
} from 'common-lib';
import {
	findAndBind,
	generateResults,
	getAccount,
	getAttendanceForEvent,
	getCAPAccountsForORGID,
	getEvent,
	getFullPointsOfContact,
	getOrgName,
	getRegistry,
	getRegistryById,
	resolveReference,
} from 'server-common';

interface LinkedEventInfo {
	id: number;
	accountID: string;
	name: string;
	accountName: string;
}

export const expandLinkedEvent = (schema: Schema) => ({
	id,
	name,
	accountID,
}: RawEventObject): ServerEither<LinkedEventInfo> =>
	getRegistryById(schema)(accountID).map(({ Website: { Name: accountName } }) => ({
		accountName,
		name,
		id,
		accountID,
	}));

export const getLinkedEvents = (
	req: ServerAPIRequestParameter<api.events.events.GetEventViewerData>,
) => (event: RawEventObject): ServerEither<LinkedEventInfo[]> =>
	asyncRight(
		collectGeneratorAsync(
			asyncIterMap<Right<LinkedEventInfo>, LinkedEventInfo>(get('value'))(
				asyncIterFilter<EitherObj<ServerError, LinkedEventInfo>, Right<LinkedEventInfo>>(
					Either.isRight,
				)(
					asyncIterMap<RawEventObject, EitherObj<ServerError, LinkedEventInfo>>(
						expandLinkedEvent(req.mysqlx),
					)(
						generateResults(
							findAndBind(req.mysqlx.getCollection<RawEventObject>('Events'), {
								sourceEvent: { id: event.id, accountID: event.accountID },
							}),
						),
					),
				),
			),
		),
		errorGenerator('Could not get events linked to this one'),
	);

export const getFullEventInformation = (
	req: ServerAPIRequestParameter<api.events.events.GetEventViewerData>,
) => (event: RawEventObject): ServerEither<AsyncRepr<api.events.events.EventViewerData>> =>
	AsyncEither.All([
		asyncRight(
			getOrgName({
				byId: always(memoize(getAccount(req.mysqlx))),
				byOrgid: always(memoize(getCAPAccountsForORGID(req.mysqlx))),
			})(req.mysqlx)(req.account),
			errorGenerator('Could not get stuff'),
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
		event.sourceEvent
			? getRegistryById(req.mysqlx)(event.sourceEvent.accountID).map(reg => reg.Website.Name)
			: asyncRight(void 0, errorGenerator('Could not get account name')),
		getLinkedEvents(req)(event),
	]).map<AsyncRepr<api.events.events.EventViewerData>>(
		([attendees, pointsOfContact, sourceAccountName, linkedEvents]) => ({
			event,
			attendees,
			pointsOfContact,
			sourceAccountName,
			linkedEvents,
		}),
	);

export const func: ServerAPIEndpoint<api.events.events.GetEventViewerData> = req =>
	getEvent(req.mysqlx)(req.account)(req.params.id).flatMap(event =>
		canMaybeManageEvent(Permissions.ManageEvent.FULL)(req.member)(event)
			? getFullEventInformation(req)(event)
			: AsyncEither.All([
					getRegistry(req.mysqlx)(req.account),
					Maybe.isSome(req.member)
						? getAttendanceForEvent(req.mysqlx)(event)
						: asyncRight<ServerError, AsyncIter<AttendanceRecord>>(
								[],
								errorGenerator(),
						  ),
					getFullPointsOfContact(req.mysqlx)(req.account)(
						event.pointsOfContact.map(poc => ({
							...poc,
							email: !!poc.publicDisplay || Maybe.isSome(req.member) ? poc.email : '',
							phone: !!poc.publicDisplay || Maybe.isSome(req.member) ? poc.phone : '',
						})),
					),
					event.sourceEvent
						? getRegistryById(req.mysqlx)(event.sourceEvent.accountID).map(
								reg => reg.Website.Name,
						  )
						: asyncRight(void 0, errorGenerator('Could not get account name')),
					getLinkedEvents(req)(event),
			  ]).map<AsyncRepr<api.events.events.EventViewerData>>(
					([registry, attendees, pointsOfContact, sourceAccountName, linkedEvents]) => ({
						event,
						attendees:
							event.privateAttendance &&
							!canMaybeManageEvent(Permissions.ManageEvent.FULL)(req.member)(event)
								? []
								: asyncIterMap((record: AttendanceRecord) =>
										Either.right({
											member: Maybe.none(),
											record,
											orgName: Maybe.some(registry.Website.Name),
										}),
								  )(attendees),
						pointsOfContact,
						sourceAccountName,
						linkedEvents,
					}),
			  ),
	);

export default func;
