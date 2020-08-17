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

import { ServerAPIEndpoint, validator } from 'auto-client-api';
import {
	api,
	asyncEither,
	asyncIterFilter,
	asyncIterMap,
	Either,
	EitherObj,
	errorGenerator,
	get,
	Member,
	MemberType,
	Right,
	ServerError,
	SessionType,
	Validator,
	ValidatorFail,
} from 'common-lib';
import { getMembers, PAM } from 'server-common';

const typeValidator = validator<MemberType | undefined>(Validator);

export const func: ServerAPIEndpoint<api.member.Members> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(req =>
	asyncEither(
		Either.leftMap<ValidatorFail, ServerError, MemberType | undefined>(validatorState => ({
			type: 'VALIDATOR',
			code: 400,
			message: 'Invalid member type',
			validatorState,
		}))(typeValidator.validate(req.params.type, 'type')),
		errorGenerator('Could not get member type'),
	)
		.map(getMembers(req.mysqlx)(req.account))
		.map(asyncIterFilter<EitherObj<ServerError, Member>, Right<Member>>(Either.isRight))
		.map(asyncIterMap(get('value'))),
);

export default func;
