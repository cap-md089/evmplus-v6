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

import {
	api,
	AsyncEither,
	asyncEitherIterFlatMap,
	asyncIterFilter,
	asyncIterMap,
	asyncLeft,
	asyncRight,
	canFullyManageEvent,
	Either,
	EitherObj,
	errorGenerator,
	EventStatus,
	filterEventInformation,
	FromDatabase,
	get,
	isRegularCAPAccountObject,
	Maybe,
	MaybeObj,
	pipe,
	RawEventObject,
	RawResolvedEventObject,
	Right,
	ServerError,
	User,
} from 'common-lib';
import {
	AccountBackend,
	Backends,
	EventsBackend,
	getCombinedEventsBackend,
	RegistryBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const canMaybeManageEvent = (event: RawEventObject) => (member: MaybeObj<User>) =>
	pipe(
		Maybe.map<User, (e: RawEventObject) => boolean>(canFullyManageEvent),
		Maybe.orSome<(e: RawEventObject) => boolean>(() => false),
	)(member)(event);

export const func: Endpoint<
	Backends<[RegistryBackend, EventsBackend, AccountBackend]>,
	api.events.events.GetCompoundRange
> = backend => req =>
	isRegularCAPAccountObject(req.account)
		? AsyncEither.All([
				asyncRight<ServerError, [number, number]>(
					[parseInt(req.params.timestart, 10), parseInt(req.params.timeend, 10)],
					errorGenerator('Could not get events in range'),
				),
				backend.getSubordinateCAPUnits(req.account),
		  ])
				.filter(([[timestart, timeend]]) => !isNaN(timestart) && !isNaN(timeend), {
					type: 'OTHER',
					code: 400,
					message: 'The provided range start and end are invalid',
				})
				.flatMap(([range, accounts]) =>
					AsyncEither.All([
						asyncRight(
							backend.getEventsInRangeForMultipleAccounts(accounts)(range),
							errorGenerator('Could not get event information'),
						)
							.map(asyncEitherIterFlatMap(backend.ensureResolvedEvent))
							.map(
								asyncIterFilter<
									EitherObj<ServerError, FromDatabase<RawResolvedEventObject>>,
									Right<FromDatabase<RawResolvedEventObject>>
								>(Either.isRight),
							)
							.map(asyncIterMap(get('value')))
							.map(
								asyncIterFilter<FromDatabase<RawResolvedEventObject>>(
									event =>
										event.status !== EventStatus.DRAFT ||
										canMaybeManageEvent(event)(req.member),
								),
							)
							.map(asyncIterMap(filterEventInformation(req.member))),
						asyncRight(accounts, errorGenerator('Could not get account information'))
							.map(
								asyncIterMap(account =>
									backend
										.getRegistryUnsafe(account.id)
										.map(({ Website: { Name: displayName } }) => ({
											accountID: account.id,
											displayName,
										})),
								),
							)
							.map(
								asyncIterFilter<
									EitherObj<
										ServerError,
										{ accountID: string; displayName: string }
									>,
									Right<{ accountID: string; displayName: string }>
								>(Either.isRight),
							)
							.map(asyncIterMap(get('value'))),
					])
						.map(([events, accounts]) => ({
							events,
							accounts,
						}))
						.map(wrapper),
				)
		: asyncLeft({
				type: 'OTHER',
				code: 400,
				message: 'This API is not available for this account type',
		  });

export default withBackends(func, getCombinedEventsBackend());
