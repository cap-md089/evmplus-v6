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
	asyncEither,
	Either,
	errorGenerator,
	ValidatorError,
	ValidatorFail,
	ValidatorImpl,
} from 'common-lib';
import { ServerEither } from 'server-common';

export const validateRequest = <T extends any>(validator: ValidatorImpl<T>) => <
	R extends { body: unknown }
>(
	req: R,
): ServerEither<Omit<R, 'body'> & { body: T }> =>
	asyncEither(
		Either.leftMap<ValidatorFail, ValidatorError, T>(validatorState => ({
			type: 'VALIDATOR',
			code: 400,
			message: 'There was a problem with the request body',
			validatorState,
		}))(validator.validate(req.body, 'body')),
		errorGenerator('Could not validate body'),
	).map<Omit<R, 'body'> & { body: T }>(body => ({ ...req, body }));
