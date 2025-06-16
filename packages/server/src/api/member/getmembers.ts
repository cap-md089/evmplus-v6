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
	Either,
	errorGenerator,
	MemberType,
	ServerError,
	SessionType,
	Validator,
	ValidatorFail,
	ValidatorImpl,
} from 'common-lib';
import {
	AccountBackend,
	Backends,
	BasicAccountRequest,
	CAP,
	combineBackends,
	getCombinedMemberBackend,
	getCombinedTeamsBackend,
	getDefaultAccountBackend,
	MemberBackend,
	PAM,
	TeamsBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../..';
import wrapper from '../../lib/wrapper';

const typeValidator: ValidatorImpl<MemberType | undefined> = Validator.Optional(
	Validator.Or(
		'MemberType',
		Validator.StrictValue('CAPNHQMember'),
		Validator.StrictValue('CAPProspectiveMember'),
	),
);

export const func: Endpoint<
	Backends<[AccountBackend, MemberBackend, CAP.CAPMemberBackend, TeamsBackend]>,
	api.member.Members
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		asyncEither(
			Either.leftMap<ValidatorFail, ServerError, MemberType | undefined>(validatorState => ({
				type: 'VALIDATOR',
				code: 400,
				message: 'Invalid member type',
				validatorState,
			}))(typeValidator.validate(req.params.type, 'type')),
			errorGenerator('Could not get member type'),
		)
			.flatMap(backend.getMembers(backend)(req.account))
			.map(wrapper),
	);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[AccountBackend, MemberBackend, CAP.CAPMemberBackend, TeamsBackend]
	>(
		getDefaultAccountBackend(),
		getCombinedMemberBackend(),
		CAP.getCAPMemberBackend,
		getCombinedTeamsBackend(),
	),
);
