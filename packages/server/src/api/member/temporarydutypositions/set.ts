/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	api,
	asyncEither,
	CAPMember,
	destroy,
	errorGenerator,
	parseStringMemberReference,
	Permissions,
	SessionType,
	ShortCAPUnitDutyPosition,
	ShortDutyPosition,
} from 'common-lib';
import {
	Backends,
	BasicAccountRequest,
	CAP,
	combineBackends,
	getCombinedMemberBackend,
	getTimeBackend,
	MemberBackend,
	PAM,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const getDutyPosition = (now = Date.now) => (oldPositions: ShortDutyPosition[]) => (duty: string) =>
	oldPositions.find(({ duty: oldDuty, type }) => duty === oldDuty && type === 'CAPUnit') ?? {
		type: 'CAPUnit' as const,
		duty,
		date: now(),
	};

const updateDutyPosition = (now = Date.now) => (oldPositions: ShortDutyPosition[]) => ({
	duty,
	expires,
}: ShortCAPUnitDutyPosition) => ({
	...getDutyPosition(now)(oldPositions)(duty),
	expires,
});

const getNewPositions = (now = Date.now) => (
	newPositions: Array<Omit<ShortCAPUnitDutyPosition, 'date'>>,
) => (oldPositions: ShortDutyPosition[]): ShortDutyPosition[] => [
	...newPositions.map(updateDutyPosition(now)(oldPositions)),
	...oldPositions.filter(({ type }) => type !== 'CAPUnit'),
];

export const func: Endpoint<
	Backends<[TimeBackend, MemberBackend]>,
	api.member.temporarydutypositions.SetTemporaryDutyPositions
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresPermission(
			'AssignTemporaryDutyPositions',
			Permissions.AssignTemporaryDutyPosition.YES,
		)(req =>
			asyncEither(
				parseStringMemberReference(req.params.id),
				errorGenerator('Could not parse member ID'),
			)
				.flatMap(backend.getMember(req.account))
				.map<CAPMember>(member => ({
					...member,
					dutyPositions: getNewPositions(backend.now)(req.body.dutyPositions)(
						member.dutyPositions,
					),
				}))
				.tap(member => {
					req.memberUpdateEmitter.emit('memberChange', {
						member,
						account: req.account,
					});
				})
				.flatMap(CAP.getExtraMemberInformationForCAPMember(req.account))
				.flatMap(backend.saveExtraMemberInformation)
				.map(destroy)
				.map(wrapper),
		),
	);

export default withBackends(
	func,
	combineBackends<BasicAccountRequest, [TimeBackend, MemberBackend]>(
		getTimeBackend,
		getCombinedMemberBackend(),
	),
);
