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

import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncIterFilter,
	asyncIterMap,
	asyncIterTap,
	asyncRight,
	CAPExtraMemberInformation,
	collectGeneratorAsync,
	destroy,
	Either,
	EitherObj,
	errorGenerator,
	get,
	Member,
	MemberReference,
	Permissions,
	Right,
	ServerError,
	SessionType,
} from 'common-lib';
import { PAM, resolveReference, saveExtraMemberInformation } from 'server-common';
import { getExtraMemberInformationForCAPMember } from 'server-common/dist/member/members/cap';

export const func: ServerAPIEndpoint<api.member.flight.AssignBulk> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(
	PAM.RequiresPermission(
		'FlightAssign',
		Permissions.FlightAssign.YES,
	)(req =>
		asyncRight(req.body.members, errorGenerator('Could not update member information'))
			.map(
				asyncIterMap<
					{ newFlight: string | null; member: MemberReference },
					EitherObj<ServerError, { newFlight: string | null; member: Member }>
				>(info =>
					resolveReference(req.mysqlx)(req.account)(info.member).map(member => ({
						member,
						newFlight: info.newFlight,
					})),
				),
			)
			.map(
				asyncIterFilter<
					EitherObj<ServerError, { newFlight: string | null; member: Member }>,
					Right<{ newFlight: string | null; member: Member }>
				>(Either.isRight),
			)
			.map(asyncIterMap(get('value')))
			.map(asyncIterFilter(info => info.newFlight !== info.member.flight))
			.map(
				asyncIterMap(info => [
					{
						...info.member,
						flight: info.newFlight,
					},
					info.member,
				]),
			)
			.map(
				asyncIterTap(([newMember, oldMember]) => {
					if (newMember.flight !== oldMember.flight) {
						req.memberUpdateEmitter.emit('memberChange', {
							member: newMember,
							account: req.account,
						});
					}
				}),
			)
			.map(asyncIterMap(([newMember]) => newMember))
			.map(asyncIterMap(getExtraMemberInformationForCAPMember(req.account)))
			.map(
				asyncIterFilter<
					EitherObj<ServerError, CAPExtraMemberInformation>,
					Right<CAPExtraMemberInformation>
				>(Either.isRight),
			)
			.map(asyncIterMap(get('value')))
			.map(asyncIterMap(saveExtraMemberInformation(req.mysqlx)(req.account)))
			.map(collectGeneratorAsync)
			.map(destroy),
	),
);

export default func;
